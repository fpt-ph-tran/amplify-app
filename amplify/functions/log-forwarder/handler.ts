import type { CloudWatchLogsHandler } from "aws-lambda";
import { gunzipSync } from "zlib";

const WEBHOOK_URL = process.env.COWORK_WEBHOOK_URL;

/** Don't let one noisy invocation flood the webhook. */
const MAX_EVENTS_PER_INVOCATION = 20;

interface DecodedPayload {
  messageType: string;
  owner: string;
  logGroup: string;
  logStream: string;
  logEvents: Array<{ id: string; timestamp: number; message: string }>;
}

/**
 * Triggered directly by a CloudWatch Logs subscription filter (see
 * amplify/monitoring.ts), so the payload is the real log events — message and
 * stack trace included — rather than an alarm saying a counter moved.
 *
 * The body posted to Cowork Local keeps the SNS notification shape, because
 * that is what its webhook ingestion auto-detects (core/incident/ingest.py's
 * AWS branch). There is no SNS topic in the pipeline any more; the envelope is
 * purely for compatibility with that parser, and the fields it keys on carry
 * the actual error now. If Cowork Local's ingestion learns this shape, the
 * wrapper can be dropped.
 */
export const handler: CloudWatchLogsHandler = async (event) => {
  if (!WEBHOOK_URL) {
    console.error("COWORK_WEBHOOK_URL is not set — dropping this batch.");
    return;
  }

  const decoded: DecodedPayload = JSON.parse(
    gunzipSync(Buffer.from(event.awslogs.data, "base64")).toString("utf8")
  );

  // CloudWatch sends one of these when the subscription is first created.
  if (decoded.messageType !== "DATA_MESSAGE") return;

  const region = process.env.AWS_REGION ?? "";
  // "/aws/lambda/amplify-...-checkout-lambda..." -> "checkout-lambda..."
  const fnName = decoded.logGroup.replace(/^\/aws\/lambda\//, "");
  const events = decoded.logEvents.slice(0, MAX_EVENTS_PER_INVOCATION);

  if (decoded.logEvents.length > events.length) {
    console.warn(
      `Batch had ${decoded.logEvents.length} events; forwarding the first ${events.length}.`
    );
  }

  for (const logEvent of events) {
    const occurredAt = new Date(logEvent.timestamp).toISOString();
    const body = JSON.stringify({
      Type: "Notification",
      TopicArn: `arn:aws:logs:${region}:${decoded.owner}:log-group:${decoded.logGroup}`,
      Subject: `QuickCart ${fnName} error`,
      Timestamp: occurredAt,
      Message: JSON.stringify({
        AlarmName: `QuickCart-${fnName}-errors`,
        NewStateValue: "ALARM",
        // The whole point of the rewrite: the real log line, not "threshold crossed".
        NewStateReason: logEvent.message,
        StateChangeTime: occurredAt,
        Region: region,
        AWSAccountId: decoded.owner,
        Trigger: { Namespace: "QuickCart", MetricName: `${fnName}Errors` },
        logGroup: decoded.logGroup,
        logStream: decoded.logStream,
        eventId: logEvent.id,
        message: logEvent.message,
      }),
    });

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) {
        console.error(`Cowork Local webhook responded ${res.status}: ${await res.text()}`);
      }
    } catch (err) {
      // Don't rethrow: a dead/rotated tunnel URL shouldn't retry-storm the
      // subscription. The event is still in CloudWatch Logs either way.
      console.error("Failed to forward incident to Cowork Local:", err);
    }
  }
};

import type { SQSHandler } from "aws-lambda";

const WEBHOOK_URL = process.env.COWORK_WEBHOOK_URL;

/**
 * SQS-triggered (subscribed to the IncidentTopic → Queue set up in
 * amplify/monitoring.ts). SNS wraps whatever fired the alarm in its own
 * `{ Type: "Notification", Message: "<json string>", ... }` envelope — that
 * is exactly the shape Cowork Local's webhook ingestion auto-detects
 * (core/incident/ingest.py's AWS branch), so this forwards the SQS message
 * body through UNCHANGED rather than re-shaping it.
 */
export const handler: SQSHandler = async (event) => {
  if (!WEBHOOK_URL) {
    console.error("COWORK_WEBHOOK_URL is not set — dropping", event.Records.length, "record(s).");
    return;
  }

  for (const record of event.Records) {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: record.body,
      });
      if (!res.ok) {
        console.error(`Cowork Local webhook responded ${res.status}: ${await res.text()}`);
      }
    } catch (err) {
      // Don't rethrow: a dead/rotated tunnel URL shouldn't retry-storm SQS.
      // The message is still visible in CloudWatch Logs for this function.
      console.error("Failed to forward incident to Cowork Local:", err);
    }
  }
};

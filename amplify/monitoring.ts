import { Duration } from "aws-cdk-lib";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cwActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubs from "aws-cdk-lib/aws-sns-subscriptions";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sqsSubs from "aws-cdk-lib/aws-lambda-event-sources";
import type { Construct } from "constructs";
import type * as lambdaNode from "aws-cdk-lib/aws-lambda";

/**
 * CloudWatch Logs -> Metric Filter -> Alarm -> SNS -> SQS -> log-forwarder
 * Lambda -> Cowork Local's webhook. One metric filter + alarm per watched
 * function so each bug's error still shows up as its own incident.
 *
 * `watchedFunctions` are the Lambdas whose CloudWatch Logs should be
 * monitored for errors (checkout, catalog); `forwarderFunction` is the
 * Lambda that actually delivers to Cowork Local (subscribed to the SQS queue
 * this sets up).
 */
export function configureMonitoring(
  scope: Construct,
  watchedFunctions: Record<string, lambdaNode.IFunction>,
  forwarderFunction: lambdaNode.IFunction
): void {
  const topic = new sns.Topic(scope, "IncidentTopic", {
    displayName: "QuickCart production incidents",
  });

  const queue = new sqs.Queue(scope, "IncidentQueue", {
    visibilityTimeout: Duration.seconds(30),
    retentionPeriod: Duration.days(3),
  });

  topic.addSubscription(new snsSubs.SqsSubscription(queue));
  forwarderFunction.addEventSource(new sqsSubs.SqsEventSource(queue, { batchSize: 1 }));

  for (const [name, fn] of Object.entries(watchedFunctions)) {
    const logGroup = logs.LogGroup.fromLogGroupName(
      scope,
      `${name}LogGroup`,
      `/aws/lambda/${fn.functionName}`
    );

    const errorMetric = new logs.MetricFilter(scope, `${name}ErrorFilter`, {
      logGroup,
      metricNamespace: "QuickCart",
      metricName: `${name}Errors`,
      filterPattern: logs.FilterPattern.anyTerm("ERROR", "Exception", "AccessDenied", "Task timed out"),
      metricValue: "1",
    }).metric({ statistic: "Sum", period: Duration.minutes(1) });

    const alarm = new cloudwatch.Alarm(scope, `${name}ErrorAlarm`, {
      alarmName: `QuickCart-${name}-errors`,
      metric: errorMetric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Triggers when the ${name} Lambda logs an error — forwarded to Cowork Local.`,
    });
    alarm.addAlarmAction(new cwActions.SnsAction(topic));
  }
}

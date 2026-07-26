import * as logs from "aws-cdk-lib/aws-logs";
import * as destinations from "aws-cdk-lib/aws-logs-destinations";
import type { Construct } from "constructs";
import type * as lambdaNode from "aws-cdk-lib/aws-lambda";

/**
 * CloudWatch Logs -> subscription filter -> log-forwarder Lambda -> Cowork
 * Local's webhook.
 *
 * This deliberately does NOT go through a metric filter + alarm + SNS + SQS.
 * That chain is an *alerting* pipeline: a metric filter reduces a log line to
 * the number 1, so everything downstream only ever knows "the checkout Lambda
 * errored at least once in the last minute" — no message, no stack trace, and
 * bug #3 arrives looking identical to bug #7. It is also slow (a full alarm
 * evaluation period) and, because an alarm only notifies on a state
 * *transition*, firing several bugs in a row delivers a single notification.
 *
 * A subscription filter ships the matching log events themselves, within
 * seconds, one delivery per occurrence — which is what a bug tracker needs.
 */
export function configureMonitoring(
  scope: Construct,
  // Concrete `Function`, not `IFunction`: we need `.logGroup` below, which only
  // the owned construct exposes.
  watchedFunctions: Record<string, lambdaNode.Function>,
  forwarderFunction: lambdaNode.IFunction
): void {
  // Anything the handlers log at error level. Lambda's own "Task timed out"
  // line is included so bug #8 reports itself even though the function dies
  // before it can log anything.
  const errorPattern = logs.FilterPattern.anyTerm(
    "ERROR",
    "Exception",
    "AccessDenied",
    "Task timed out"
  );

  for (const [name, fn] of Object.entries(watchedFunctions)) {
    new logs.SubscriptionFilter(scope, `${name}ErrorSubscription`, {
      // Reading `.logGroup` also makes CDK pre-create the group at deploy time;
      // Lambda would otherwise only create it on first invocation, and there
      // would be nothing to attach the filter to.
      logGroup: fn.logGroup,
      // A destination per filter: LambdaDestination.bind creates the
      // logs.amazonaws.com invoke permission as a child of the filter, so
      // sharing one instance across log groups would collide.
      destination: new destinations.LambdaDestination(forwarderFunction),
      filterPattern: errorPattern,
      filterName: `QuickCart-${name}-errors`,
    });
  }
}

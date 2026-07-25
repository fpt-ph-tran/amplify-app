import { defineBackend } from "@aws-amplify/backend";
import * as s3 from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { checkout } from "./functions/checkout/resource";
import { catalog } from "./functions/catalog/resource";
import { logForwarder } from "./functions/log-forwarder/resource";
import { configureMonitoring } from "./monitoring";

const backend = defineBackend({
  auth,
  data,
  checkout,
  catalog,
  logForwarder,
});

const backendStack = backend.checkout.resources.lambda.stack;

// Audit-log bucket for Bug #3 — the checkout Lambda writes an order receipt
// here on every order.
const auditBucket = new s3.Bucket(backendStack, "AuditLogBucket", {
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

const productTable = backend.data.resources.tables["Product"];
const orderTable = backend.data.resources.tables["Order"];
const ratingTable = backend.data.resources.tables["Rating"];

// ---- checkout Lambda wiring -------------------------------------------
backend.checkout.addEnvironment("PRODUCT_TABLE_NAME", productTable.tableName);
backend.checkout.addEnvironment("ORDER_TABLE_NAME", orderTable.tableName);
backend.checkout.addEnvironment("AUDIT_BUCKET_NAME", auditBucket.bucketName);
productTable.grantReadWriteData(backend.checkout.resources.lambda);
orderTable.grantReadWriteData(backend.checkout.resources.lambda);
// Bug #3, INTENTIONAL: no `auditBucket.grantPut(...)` call here. The
// checkout Lambda's role has no s3:PutObject permission on this bucket, so
// every single order fails that write with AccessDenied — see docs/BUGS.md.

// ---- catalog Lambda wiring ---------------------------------------------
backend.catalog.addEnvironment("PRODUCT_TABLE_NAME", productTable.tableName);
backend.catalog.addEnvironment("RATING_TABLE_NAME", ratingTable.tableName);
productTable.grantReadData(backend.catalog.resources.lambda);
ratingTable.grantReadData(backend.catalog.resources.lambda);

// ---- CloudWatch -> SNS -> SQS -> log-forwarder -> Cowork Local ----------
configureMonitoring(
  backendStack,
  {
    checkout: backend.checkout.resources.lambda,
    catalog: backend.catalog.resources.lambda,
  },
  backend.logForwarder.resources.lambda
);

export default backend;

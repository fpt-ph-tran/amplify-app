import type { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const PRODUCT_TABLE = process.env.PRODUCT_TABLE_NAME!;
const ORDER_TABLE = process.env.ORDER_TABLE_NAME!;
const AUDIT_BUCKET = process.env.AUDIT_BUCKET_NAME!;

interface CheckoutItem {
  productId: string;
  quantity: number;
}

interface CheckoutRequest {
  sessionId: string;
  items: CheckoutItem[];
  couponCode?: string;
  idempotencyKey?: string;
  // Chaos-Panel-only flags: force a specific bug's failure mode on demand,
  // instead of relying on real timing/concurrency during a live demo.
  simulateSlowShipping?: boolean;
  simulateExpiredToken?: boolean;
}

class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

/** Bug #8: a "shipping estimate" call to a downstream service that is
 * sometimes slow — combined with checkout's tight 6s Lambda timeout
 * (amplify/functions/checkout/resource.ts), this reliably times out when
 * simulateSlowShipping is set, surfacing as a 504 to the frontend. */
async function getShippingEstimate(slow: boolean | undefined): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, slow ? 8000 : 150));
  return 4.99;
}

/** Bug #5 + #6: coupon math is order-dependent (a flat discount applied
 * BEFORE a percentage discount gives a different, wrong-looking total than
 * applying them the other way round — real invoices should be deterministic
 * either way) and prices are summed as plain JS floats, so carts with many
 * line items drift by a cent or two from the "obviously correct" total. */
function calculateTotal(items: Array<{ price: number; quantity: number }>, couponCode?: string): number {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity; // float accumulation — Bug #6
  }
  if (couponCode === "SAVE10") {
    total = total * 0.9; // 10% off
  }
  if (couponCode === "FLAT5") {
    total = total - 5; // Bug #5: applied on whatever `total` already is —
    // stack SAVE10 + FLAT5 in different request orders and the result
    // differs depending on which branch ran first, with no defined spec
    // for which is "correct".
  }
  return total; // NOT rounded to cents on purpose — Bug #6
}

export const handler: Handler<CheckoutRequest> = async (event) => {
  const { sessionId, items, couponCode, idempotencyKey, simulateSlowShipping, simulateExpiredToken } = event;

  // Bug #9: the Chaos Panel can force this deterministically; in real usage
  // this fires when a Cognito token has actually expired mid-checkout and
  // the frontend never refreshes it before calling checkout.
  if (simulateExpiredToken) {
    throw new HttpError(401, "Unauthorized: session token has expired.");
  }

  // Bug #7: no validation at all on quantities or product ids.
  // - A made-up productId: no `if (!res.Item) throw new HttpError(404, ...)`
  //   guard, so `res.Item.price` below throws "Cannot read properties of
  //   undefined" — an unhandled 500, not a clean 4xx.
  // - A negative quantity: happily accepted, silently INCREASES stock (see
  //   the UpdateCommand below: `stock - :qty` with a negative qty adds
  //   instead of subtracts) and produces a negative line total — no crash,
  //   just quietly wrong data.
  const fetchedItems = await Promise.all(
    items.map(async (item) => {
      const res = await ddb.send(
        new GetCommand({ TableName: PRODUCT_TABLE, Key: { id: item.productId } })
      );
      return {
        id: res.Item!.id as string,
        name: res.Item!.name as string,
        price: res.Item!.price as number,
        stock: res.Item!.stock as number,
        quantity: item.quantity,
      };
    })
  );

  // Bug #1 (oversell): stock is decremented with a plain UpdateCommand and
  // no ConditionExpression — two concurrent checkouts for the same last
  // unit both read stock=1, both pass, both decrement to 0/-1.
  for (const item of fetchedItems) {
    await ddb.send(
      new UpdateCommand({
        TableName: PRODUCT_TABLE,
        Key: { id: item.id },
        UpdateExpression: "SET stock = stock - :qty",
        ExpressionAttributeValues: { ":qty": item.quantity },
        // MISSING: ConditionExpression: "stock >= :qty"
      })
    );
  }

  const total = calculateTotal(fetchedItems, couponCode);
  await getShippingEstimate(simulateSlowShipping);

  // Bug #2 (duplicate order on retry): idempotencyKey is accepted but never
  // actually checked against existing orders before writing a new one — a
  // retried/double-clicked request creates a second Order every time.
  const orderId = randomUUID();
  await ddb.send(
    new PutCommand({
      TableName: ORDER_TABLE,
      Item: {
        id: orderId,
        sessionId,
        items: fetchedItems,
        total,
        couponCode: couponCode ?? null,
        status: "confirmed",
        idempotencyKey: idempotencyKey ?? null,
        createdAt: new Date().toISOString(),
      },
      // MISSING: a check (or ConditionExpression on a separate idempotency
      // table) that would reject a second write for the same idempotencyKey.
    })
  );

  // Bug #3 (IAM AccessDenied): the checkout Lambda's execution role is
  // deliberately NOT granted s3:PutObject on the audit bucket (see
  // amplify/backend.ts) — this call throws AccessDenied on every order,
  // exactly mirroring the reference incident this project is modeled after.
  await s3.send(
    new PutObjectCommand({
      Bucket: AUDIT_BUCKET,
      Key: `orders/${orderId}.json`,
      Body: JSON.stringify({ orderId, sessionId, total, items: fetchedItems }),
      ContentType: "application/json",
    })
  );

  return { orderId, total };
};

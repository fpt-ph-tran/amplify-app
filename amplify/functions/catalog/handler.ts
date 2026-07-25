import type { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PRODUCT_TABLE = process.env.PRODUCT_TABLE_NAME!;
const RATING_TABLE = process.env.RATING_TABLE_NAME!;

/**
 * Bug #10 (N+1 query): fetches the full product list with ONE Scan, then
 * fetches each product's rating with a SEPARATE GetItem call in a loop —
 * instead of a single BatchGetItem. Fine for the ~20-30 seed products; once
 * the catalog grows, this pattern is what starts throttling DynamoDB (and is
 * exactly the kind of thing that passes code review on a small dataset and
 * only shows up as a real incident under load).
 */
export const handler: Handler = async () => {
  const products = await ddb.send(new ScanCommand({ TableName: PRODUCT_TABLE }));
  const items = products.Items ?? [];

  const withRatings = [];
  for (const item of items) {
    // One DynamoDB round-trip PER product instead of a single batch call.
    const rating = await ddb.send(
      new GetCommand({ TableName: RATING_TABLE, Key: { productId: item.id } })
    );
    withRatings.push({ ...item, rating: rating.Item?.value ?? null });
  }

  return { items: withRatings };
};

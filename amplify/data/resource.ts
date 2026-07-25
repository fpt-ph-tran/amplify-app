import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { checkout } from "../functions/checkout/resource";
import { catalog } from "../functions/catalog/resource";

/**
 * QuickCart data model. Kept intentionally simple (no owner-based auth rules,
 * public API key auth) since this is a demo app whose whole point is to
 * surface backend bugs, not to showcase auth patterns.
 */
const schema = a.schema({
  Product: a
    .model({
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      imageUrl: a.string(),
      stock: a.integer().required(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Deliberately a SEPARATE table from Product (a common real-world shape:
  // ratings/reviews often live in their own service/table) — this is what
  // makes Bug #10's per-product GetItem loop in the catalog Lambda an actual
  // N+1 instead of data that was already sitting on the Product item.
  Rating: a
    .model({
      productId: a.string().required(),
      value: a.float().required(),
      count: a.integer().required(),
    })
    .identifier(["productId"])
    .authorization((allow) => [allow.publicApiKey()]),

  Cart: a
    .model({
      sessionId: a.string().required(),
      items: a.json(), // [{ productId, name, price, qty }]
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Order: a
    .model({
      sessionId: a.string().required(),
      items: a.json(),
      total: a.float().required(),
      couponCode: a.string(),
      status: a.string().required(), // "pending" | "confirmed" | "failed"
      idempotencyKey: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Custom operations backed by the Lambda handlers, rather than plain
  // model CRUD — this is where the intentional bugs live.
  checkout: a
    .mutation()
    .arguments({
      sessionId: a.string().required(),
      items: a.json().required(), // [{ productId, quantity }]
      couponCode: a.string(),
      idempotencyKey: a.string(),
      simulateSlowShipping: a.boolean(),
      simulateExpiredToken: a.boolean(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(checkout)),

  getCatalog: a
    .query()
    .arguments({})
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(catalog)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});

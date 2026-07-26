# 02 — Domain Model

The concepts the business reasons about, and the rules that hold regardless of
how they are stored.

## Entities at a glance

```
Session ──owns──▶ Basket ──contains──▶ Line item ──refers to──▶ Product
   │                                                               │
   └──places──▶ Order ──contains──▶ Line item (frozen copy)        │
                  │                                          Rating (1:1)
                  └──produces──▶ Audit record
```

## Product

A single sellable item.

| Field | Type | Rules |
|---|---|---|
| `id` | identifier | Assigned by the system, never reused |
| `name` | text | Required, shown to customers |
| `description` | text | Optional |
| `price` | money | Required, greater than zero, in whole cents |
| `imageUrl` | url | Optional |
| `stock` | integer | Required. **Never negative.** Zero means sold out |

A product with zero stock stays visible but cannot be added to a basket.

Price is a **money** value: it is only ever manipulated as a whole number of
cents. Products are not versioned — changing a price changes it everywhere it
has not already been captured on an order.

## Rating

An aggregate score for one product. One rating record per product.

| Field | Type | Rules |
|---|---|---|
| `productId` | identifier | Identifies the product; one rating per product |
| `value` | decimal | Average score, 1.0–5.0, one decimal place |
| `count` | integer | How many individual ratings contributed. Zero or more |

A product with no rating record is displayed without a score, not as zero.

## Session

An anonymous visitor identity.

| Field | Type | Rules |
|---|---|---|
| `id` | identifier | Created on first visit, stable for the visit |
| `expiresAt` | timestamp | When the session stops being valid |

Sessions carry no personal data. A session identifies whose basket is whose,
nothing more. An expired session is a distinct, recognisable state — it is not
the same as never having had one.

## Basket

The items a shopper has chosen but not paid for. One basket per session.

| Field | Type | Rules |
|---|---|---|
| `sessionId` | identifier | Owning session |
| `items` | list of line items | May be empty |
| `updatedAt` | timestamp | Last time the basket changed |

A basket is **shared state**: the same session may be open in more than one
browser tab or device, and all of them act on the same basket. Concurrent
changes must be reconciled, never silently discarded.

A basket is working state, not a record. It may be emptied once its order is
placed.

### Line item (in a basket)

| Field | Type | Rules |
|---|---|---|
| `productId` | identifier | Must refer to a real product |
| `quantity` | integer | **Greater than zero.** Never zero, never negative |

Adding a product already in the basket increases that line's quantity rather
than creating a second line for the same product.

## Order

A confirmed purchase. **Immutable** once created.

| Field | Type | Rules |
|---|---|---|
| `id` | identifier | Assigned by the system |
| `sessionId` | identifier | Who placed it |
| `items` | list of line items | Frozen copy, including the price at the time of purchase |
| `subtotal` | money | Sum of line totals before discounts |
| `discountCodes` | list of text | The codes applied, in the order they were applied |
| `total` | money | Amount charged, after discounts. Never negative |
| `idempotencyKey` | text | Identifies the purchase intent this order came from |
| `status` | enum | See lifecycle below |
| `createdAt` | timestamp | When it was confirmed |

Line items on an order are a **frozen copy**, not a reference. A later price
change must never alter what a past order says the customer paid.

### Order lifecycle

```
   pending ──────▶ confirmed
      │
      └──────────▶ failed
```

| Status | Meaning |
|---|---|
| `pending` | Being processed. Not yet a promise to the customer |
| `confirmed` | Accepted. Stock is committed, the customer has been told it succeeded |
| `failed` | Did not complete. No stock committed, nothing charged, customer told it failed |

There is no path out of `confirmed` or `failed` — both are final. An order is
never partially confirmed: either every line succeeds or the whole order fails.

## Audit record

The permanent record of an order, kept for reconciliation.

| Field | Type | Rules |
|---|---|---|
| `orderId` | identifier | The order it describes |
| `sessionId` | identifier | Who placed it |
| `items` | list of line items | As charged |
| `total` | money | As charged |
| `createdAt` | timestamp | When written |

One audit record per confirmed order, no exceptions. Write-once: never
modified, never deleted.

## Money

Every monetary amount in this specification obeys the same rules:

- Held as a whole number of **cents**; never as a fractional value
- Arithmetic is exact — no result may depend on floating-point representation
- Rounded **once**, at the end of a calculation, never at intermediate steps
- Displayed to exactly two decimal places
- The amount shown to the customer and the amount recorded on the order are the
  same number, always

## Invariants

These hold at all times, in every code path.

| # | Invariant |
|---|---|
| INV-1 | `Product.stock` is never negative |
| INV-2 | A basket line quantity is always an integer greater than zero |
| INV-3 | An order's `total` equals its `subtotal` minus its applied discounts, and is never negative |
| INV-4 | One `idempotencyKey` corresponds to at most one order |
| INV-5 | Every `confirmed` order has exactly one audit record |
| INV-6 | The sum of an order's line totals equals its `subtotal`, to the cent |
| INV-7 | An order's line items never change after creation |

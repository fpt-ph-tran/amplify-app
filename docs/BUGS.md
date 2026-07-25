# QuickCart — the 10 intentional bugs

Every bug below is real, reachable production code (not a mocked/fake error) —
triggering one throws/logs a real error from a real Lambda, which CloudWatch
picks up and forwards to Cowork Local (see `README.md` for the pipeline).
Each also has a one-click trigger on the **⚡ Chaos Panel** (`/admin/chaos`)
for a reliable live demo, except #4 and #6 which are about data quietly being
*wrong* rather than an error being thrown.

| # | Bug | Where | Chaos Panel |
|---|-----|-------|:---:|
| 1 | Oversell | `amplify/functions/checkout/handler.ts` | ✅ |
| 2 | Duplicate order on retry | `amplify/functions/checkout/handler.ts` | ✅ |
| 3 | IAM AccessDenied on audit log | `amplify/backend.ts` (missing grant) | ✅ |
| 4 | Lost cart update | Cart model (no conditional write) | — (2 tabs) |
| 5 | Coupon math is order-dependent | `amplify/functions/checkout/handler.ts` | ✅ |
| 6 | Floating-point rounding drift | `amplify/functions/checkout/handler.ts` | — (many items) |
| 7 | Unhandled invalid input | `amplify/functions/checkout/handler.ts` | ✅ |
| 8 | Lambda timeout on shipping estimate | `amplify/functions/checkout/handler.ts` | ✅ |
| 9 | Stale/expired session token | `amplify/functions/checkout/handler.ts` | ✅ |
| 10 | N+1 catalog query | `amplify/functions/catalog/handler.ts` | ✅ |

---

## 1. Oversell

**What:** the checkout Lambda decrements `Product.stock` with a plain
`UpdateCommand` and no `ConditionExpression`. Two concurrent checkouts for
the last unit both read `stock = 1`, both pass, both decrement — final stock
can go negative.

**Reproduce:** Chaos Panel → "#1 Oversell" (fires 2 concurrent checkouts for
*all* remaining stock of one product at once). Or manually: two browser tabs,
same low-stock product, submit checkout in both within the same second.

**Real fix:** add `ConditionExpression: "stock >= :qty"` to the `UpdateCommand`
and catch `ConditionalCheckFailedException` as a clean "out of stock" 409.

## 2. Duplicate order on retry

**What:** `checkout` accepts an `idempotencyKey` argument but never checks it
against previously-seen keys before writing a new `Order` — a retried or
double-clicked request creates a second order (and, in a real payment
integration, a second charge) every time.

**Reproduce:** Chaos Panel → "#2 Duplicate order", or the Checkout page's
"⚡ Simulate double-click submit" button — both fire two requests with the
SAME idempotency key at once.

**Real fix:** a small `IdempotencyKey` table with a conditional `PutItem`
(`attribute_not_exists(key)`) BEFORE creating the order; reject the second
request instead of silently succeeding twice.

## 3. IAM AccessDenied writing the audit log

**What:** the checkout Lambda's execution role is deliberately **not**
granted `s3:PutObject` on the audit-log bucket (see the comment in
`amplify/backend.ts` right where the grant is missing). Every single order
fails that write with `AccessDenied` — this mirrors a real production
incident shape (created before the S3 write, so the order itself still
"succeeds" from the customer's point of view while the audit trail silently
never gets written).

**Reproduce:** Chaos Panel → "#3 IAM AccessDenied" (or literally any normal
checkout — this fires every time).

**Real fix:** `auditBucket.grantPut(backend.checkout.resources.lambda)` in
`amplify/backend.ts`.

## 4. Lost cart update

**What:** the `Cart` model has no version/conditional-write configured, so
Amplify Data's generated `update` mutation is a plain last-write-wins. Two
browser tabs editing the same cart at nearly the same time — one save
silently clobbers the other with no conflict error.

**Reproduce:** open `/cart` in two tabs (same browser profile → same session
id), change the quantity in both within a second or two of each other. The
last save to reach the server wins; the other change is gone with no warning.

**Real fix:** an optimistic-lock version field + `ConditionExpression` on the
update, surfacing a real conflict to the user instead of silently dropping
data.

## 5. Coupon math is order-dependent

**What:** `calculateTotal()` applies `SAVE10` (10% off) and then, in a
SEPARATE `if`, subtracts a flat `$5` for `FLAT5` — on WHATEVER `total`
already is at that point. Swap the order the discounts are described/entered
and you silently get a different final number, with no spec anywhere saying
which order is "correct".

**Reproduce:** Chaos Panel → "#5 Coupon math" (sends `"SAVE10,FLAT5"`), or the
Checkout page's coupon field.

**Real fix:** define an explicit, documented discount-stacking order (or
disallow combining codes), and add a test that pins the expected total.

## 6. Floating-point rounding drift

**What:** `calculateTotal()` accumulates `item.price * item.quantity` as
plain JS floats and never rounds to cents. A cart with many line items drifts
by a cent or two from what a calculator says it should be.

**Reproduce:** add ~15-20 cheap items to the cart (e.g. $0.10-$0.30 range,
if you seed some) and compare the displayed total to a manual sum.

**Real fix:** do money math in integer cents (or a decimal library), round
once at the very end.

## 7. Unhandled invalid input

**What:** no validation on `productId` or `quantity`. A made-up `productId`
makes `res.Item` come back `undefined` from DynamoDB, and the next line
(`res.Item!.price`) throws `Cannot read properties of undefined` — an
unhandled 500, not a clean 4xx. A **negative** quantity is accepted
silently and *increases* stock (subtracting a negative) instead of being
rejected.

**Reproduce:** Chaos Panel → "#7 Invalid input" (sends a bogus `productId`).

**Real fix:** validate `quantity > 0` and that every `productId` resolves to
a real item BEFORE touching DynamoDB; return a 400 with a clear message.

## 8. Lambda timeout on shipping estimate

**What:** `checkout`'s Lambda timeout is set to a tight 6 seconds
(`amplify/functions/checkout/resource.ts`), and the (simulated) shipping-
estimate call can take up to 8 seconds — the function gets killed mid-flight,
surfacing as a 502/504 to the frontend with no partial-progress cleanup.

**Reproduce:** Chaos Panel → "#8 Shipping timeout".

**Real fix:** either raise the timeout to comfortably exceed the downstream
call's p99, or make the shipping estimate async (return immediately, notify
the user once it resolves).

## 9. Stale / expired session token

**What:** a normal Cognito access token can expire mid-checkout if the
frontend never refreshes it; `checkout` doesn't distinguish "never
authenticated" from "token just expired" — the customer loses their place at
checkout with only a generic Unauthorized error.

**Reproduce:** Chaos Panel → "#9 Expired token" (forces the same failure
deterministically, since waiting for a real token to expire live isn't
demo-friendly).

**Real fix:** silent token refresh before the checkout call, or a graceful
"please sign in again — your cart is saved" flow instead of losing the cart.

## 10. N+1 catalog query

**What:** `catalog`'s handler does one `Scan` for all products, then loops
over every product doing a SEPARATE `GetItem` against the `Rating` table
instead of one `BatchGetItem`. Fine for ~20-30 seed products; once the
catalog grows, this is exactly the pattern that starts throttling DynamoDB
under load — invisible in code review, only shows up as a real incident.

**Reproduce:** Chaos Panel → "#10 N+1 catalog" (reloads the catalog — check
CloudWatch Logs/X-Ray for one GetItem call per product).

**Real fix:** replace the loop with a single `BatchGetItemCommand` keyed by
all product ids at once.

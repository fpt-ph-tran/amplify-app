# QuickCart — the 10 intentional bugs

Every bug below is real, reachable production code (not a mocked/fake error) —
triggering one throws/logs a real error from a real Lambda, which CloudWatch
picks up and forwards to Cowork Local (see `README.md` for the pipeline).

The **⚡ Chaos Panel** (`/admin/chaos`) offers each bug two ways:

- **Run in UI** — an autopilot takes over the browser and reproduces the bug
  by walking the real storefront: it navigates, scrolls the real controls into
  view, clicks them and types into them. Nothing is faked or called behind the
  page's back, so what the audience watches is what a customer would do.
- **Trigger** — calls the Lambda directly. Faster, but there is nothing to see.

| # | Bug | Where | Run in UI | Trigger |
|---|-----|-------|:---:|:---:|
| 1 | Oversell | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 2 | Duplicate order on retry | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 3 | IAM AccessDenied on audit log | `amplify/backend.ts` (missing grant) | ✅ | ✅ |
| 4 | Lost cart update | `Cart` model (no conditional write) | ✅ (opens a 2nd tab) | — |
| 5 | Coupon math is order-dependent | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 6 | Floating-point rounding drift | `amplify/functions/checkout/handler.ts` | ✅ | — |
| 7 | Unhandled invalid input | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 8 | Lambda timeout on shipping estimate | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 9 | Stale/expired session token | `amplify/functions/checkout/handler.ts` | ✅ | ✅ |
| 10 | N+1 catalog query | `amplify/functions/catalog/handler.ts` | ✅ | ✅ |

Every one of them is also reachable by simply using the storefront by hand —
the panel only removes the guesswork about timing. The autopilot's steps live
in `lib/chaos-scenarios.ts`, and the controls it drives are marked in the pages
with `data-chaos` attributes.

---

## 1. Oversell

**What:** the checkout Lambda decrements `Product.stock` with a plain
`UpdateCommand` and no `ConditionExpression`. Two concurrent checkouts for
the last unit both read `stock = 1`, both pass, both decrement — final stock
can go negative.

**Reproduce:** Chaos Panel → #1 **Run in UI**: it adds the product, sets the
quantity to everything left in stock, and double-clicks *Place order* so two
checkouts race. By hand: same thing, or two browser tabs submitting within the
same second. The catalog flags any product whose stock went negative.

**Real fix:** add `ConditionExpression: "stock >= :qty"` to the `UpdateCommand`
and catch `ConditionalCheckFailedException` as a clean "out of stock" 409.

## 2. Duplicate order on retry

**What:** `checkout` accepts an `idempotencyKey` argument but never checks it
against previously-seen keys before writing a new `Order` — a retried or
double-clicked request creates a second order (and, in a real payment
integration, a second charge) every time.

**Reproduce:** Chaos Panel → #2 **Run in UI**, or just double-click *Place
order* yourself. The checkout page mints one idempotency key when it opens (as
a real client would) and never disables the button, so both requests carry the
same key.

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

**Reproduce:** Chaos Panel → #3 **Run in UI**, or literally any normal
checkout — this fires every time. The handler catches and logs the failure
rather than surfacing it; that swallow *is* the bug, and it is why the customer
still gets a confirmation.

**Real fix:** `auditBucket.grantPut(backend.checkout.resources.lambda)` in
`amplify/backend.ts`.

## 4. Lost cart update

**What:** the `Cart` model has no version/conditional-write configured, so
Amplify Data's generated `update` mutation is a plain last-write-wins. Two
browser tabs editing the same cart at nearly the same time — one save
silently clobbers the other with no conflict error.

**Reproduce:** Chaos Panel → #4 **Run in UI** — it opens a second browser tab
on the same cart (allow pop-ups), has that tab write one quantity while this
one writes another, then re-reads from the server to show which change
survived. By hand: open `/cart` in two tabs and change the quantity in both
within a second or two. Last save wins, with no warning.

**Real fix:** an optimistic-lock version field + `ConditionExpression` on the
update, surfacing a real conflict to the user instead of silently dropping
data.

## 5. Coupon math is order-dependent

**What:** `calculateTotal()` walks the comma-separated coupon string and
applies each code to whatever `total` already is — `SAVE10` takes 10% off,
`FLAT5` subtracts a flat `$5`. Type the same two codes in the other order and
the basket costs a different amount, with no spec anywhere saying which order
is "correct". On a $269.70 basket that is $237.73 versus $238.23.

**Reproduce:** Chaos Panel → #5 **Run in UI** — it checks the same basket out
twice, once with `SAVE10,FLAT5` and once with `FLAT5,SAVE10`, and reports both
totals. By hand: type either string into the checkout coupon field.

**Real fix:** define an explicit, documented discount-stacking order (or
disallow combining codes), and add a test that pins the expected total.

## 6. Floating-point rounding drift

**What:** `calculateTotal()` accumulates `item.price * item.quantity` as
plain JS floats and never rounds to cents. A cart with many line items drifts
by a cent or two from what a calculator says it should be.

**Reproduce:** Chaos Panel → #6 **Run in UI** — it fills the basket with many
line items, then compares the total the page shows against the total the server
actually charged; the checkout result panel prints the drift in cents.

**Real fix:** do money math in integer cents (or a decimal library), round
once at the very end.

## 7. Unhandled invalid input

**What:** no validation on `productId` or `quantity`. A made-up `productId`
makes `res.Item` come back `undefined` from DynamoDB, and the next line
(`res.Item!.price`) throws `Cannot read properties of undefined` — an
unhandled 500, not a clean 4xx. A **negative** quantity is accepted
silently and *increases* stock (subtracting a negative) instead of being
rejected.

**Reproduce:** Chaos Panel → #7 **Run in UI** types `-2` straight into the
cart's quantity box and checks out — nothing rejects it, and the product's
stock goes *up*. **Trigger** covers the other half (a bogus `productId`, which
throws an unhandled 500).

**Real fix:** validate `quantity > 0` and that every `productId` resolves to
a real item BEFORE touching DynamoDB; return a 400 with a clear message.

## 8. Lambda timeout on shipping estimate

**What:** `checkout`'s Lambda timeout is set to a tight 6 seconds
(`amplify/functions/checkout/resource.ts`), and the (simulated) shipping-
estimate call can take up to 8 seconds — the function gets killed mid-flight,
surfacing as a 502/504 to the frontend with no partial-progress cleanup.

**Reproduce:** Chaos Panel → #8 **Run in UI** ticks the checkout's *Express
shipping — live carrier quote* option and places the order. That option is what
routes the request through the slow downstream call.

**Real fix:** either raise the timeout to comfortably exceed the downstream
call's p99, or make the shipping estimate async (return immediately, notify
the user once it resolves).

## 9. Stale / expired session token

**What:** a normal Cognito access token can expire mid-checkout if the
frontend never refreshes it; `checkout` doesn't distinguish "never
authenticated" from "token just expired" — the customer loses their place at
checkout with only a generic Unauthorized error.

**Reproduce:** Chaos Panel → #9 **Run in UI** uses the checkout's *Simulate
an idle-timeout* control — standing in for the real thing, since waiting out a
live token expiry isn't demo-friendly — and then tries to pay.

**Real fix:** silent token refresh before the checkout call, or a graceful
"please sign in again — your cart is saved" flow instead of losing the cart.

## 10. N+1 catalog query

**What:** `catalog`'s handler does one `Scan` for all products, then loops
over every product doing a SEPARATE `GetItem` against the `Rating` table
instead of one `BatchGetItem`. Fine for ~20-30 seed products; once the
catalog grows, this is exactly the pattern that starts throttling DynamoDB
under load — invisible in code review, only shows up as a real incident.

**Reproduce:** Chaos Panel → #10 **Run in UI** hits *Reload catalog* three
times and reports the average round-trip; the storefront also prints the last
load time and the lookup count under the hero. Check CloudWatch Logs/X-Ray for
one GetItem call per product.

**Real fix:** replace the loop with a single `BatchGetItemCommand` keyed by
all product ids at once.

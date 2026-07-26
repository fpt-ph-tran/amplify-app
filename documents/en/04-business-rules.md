# 04 — Business Rules

Numbered, testable statements the system must uphold. Each rule says what is
required, why the business cares, and what it costs when the rule is broken.

Quote the rule identifier when reporting a defect.

---

## Catalogue — `BR-CAT`

### BR-CAT-01 — A failed catalogue load is never shown as an empty shop
**Severity: High**

If the catalogue cannot be retrieved, the shopper is told it failed. An empty
result and a failed request are different states and must look different.

*Why:* "We have nothing to sell" and "we are broken" call for different
reactions from the shopper and from the operator. Rendering one as the other
hides an outage.

*Broken when:* the storefront shows an empty or partial catalogue while the
retrieval actually errored, timed out, or returned data the page could not read.

### BR-CAT-02 — Sold-out products cannot be added
**Severity: Medium**

A product with zero stock stays visible, is marked sold out, and cannot be put
in a basket.

### BR-CAT-03 — A missing rating is absence, not zero
**Severity: Low**

A product with no ratings is shown without a score. It is never shown as 0.0,
which reads as "customers hated it".

### BR-CAT-04 — The catalogue reflects committed stock
**Severity: High**

Stock shown is the stock actually available. A shopper must not be offered an
item that cannot be fulfilled.

---

## Basket — `BR-CRT`

### BR-CRT-01 — Quantities are positive integers
**Severity: Critical**

Every basket line quantity is a whole number of one or more. Zero, negative and
fractional quantities are rejected at entry, before anything is saved.

*Why:* a negative quantity inverts every downstream calculation — it reduces
the amount payable and *increases* stock. It turns a purchase into a refund and
a phantom restock, silently.

*Broken when:* a quantity of zero or less is accepted anywhere between the
input field and the order record.

### BR-CRT-02 — Adding a product already present increases its line
**Severity: Low**

The same product never appears as two lines in one basket.

### BR-CRT-03 — Concurrent basket changes are never silently lost
**Severity: High**

A session's basket may be edited from more than one tab or device at the same
time. When two changes overlap, the system either merges them or refuses one
and says so. It never accepts a change on screen and then discards it.

*Why:* the shopper saw their change accepted. Losing it without a word means
they pay for something they did not intend to buy, and no error is recorded
anywhere for anyone to investigate.

*Broken when:* a later write overwrites an earlier one with no conflict
detection, so the earlier change disappears with no error.

### BR-CRT-04 — A basket cannot exceed available stock
**Severity: High**

Quantities are validated against stock when set, and again at checkout.

---

## Inventory — `BR-INV`

### BR-INV-01 — Stock is never negative
**Severity: Critical**

`Product.stock` is greater than or equal to zero at all times, in every code
path, under any amount of concurrency.

*Why:* negative stock means units were sold that do not exist. Every one is an
order that cannot be fulfilled, a customer to apologise to, and a refund.

*Broken when:* stock is observed below zero, at any point, however briefly.

### BR-INV-02 — Concurrent purchases of the last unit: exactly one wins
**Severity: Critical**

When two or more checkouts compete for the same remaining stock, exactly as
many succeed as there are units. The rest are told it is sold out.

*Why:* two shoppers buying the last unit is not a rare race — it is what a
popular product looks like. Checking stock and then decrementing it as separate,
unguarded steps lets both pass the check.

*Broken when:* the total quantity ordered across concurrent checkouts exceeds
the stock that existed before them.

### BR-INV-03 — Stock is released when an order fails
**Severity: High**

If any step after stock reservation fails, the reserved stock returns. Stock is
never committed to an order that does not exist.

### BR-INV-04 — Stock only ever decreases on purchase
**Severity: Critical**

A purchase reduces stock. No customer-initiated action increases it.

*Why:* restocking is an operator decision. If a customer can drive stock upward
through the checkout, the inventory count stops meaning anything.

---

## Checkout and orders — `BR-ORD`

### BR-ORD-01 — One purchase intent creates at most one order
**Severity: Critical**

Each purchase intent carries an idempotency key. The system guarantees at most
one order per key. Repeat submissions — double-clicks, retries, refreshes,
network replays — return the original order and charge nothing further.

*Why:* this is the double-charge defect. It is the single most damaging thing a
shop can do to a customer's trust, and the customer usually notices before the
shop does.

*Broken when:* two orders exist with the same idempotency key, or one intent
results in more than one charge.

*Note:* accepting the key and not checking it is the same as not having one.

### BR-ORD-02 — Submitting is safe to repeat
**Severity: Critical**

The interface must not rely on the customer pressing the button only once.
Impatient double-clicks are expected input, not misuse.

### BR-ORD-03 — Invalid input produces a clear rejection, never a crash
**Severity: High**

Unknown products, invalid quantities and malformed requests are rejected with a
message naming the problem. They never surface as an unexpected internal error.

*Why:* a validation failure the customer can act on is a different thing from a
server fault. Conflating them wastes support time and hides real faults in the
noise.

*Broken when:* input that could have been validated instead produces an
unhandled failure.

### BR-ORD-04 — An order is all or nothing
**Severity: Critical**

Either every line is accepted and the order is confirmed, or nothing is
committed. There is no partially confirmed order.

### BR-ORD-05 — Orders are immutable
**Severity: High**

Once created, an order's lines, prices and total never change. Later price
changes do not rewrite history.

### BR-ORD-06 — Checkout completes within its budget or fails cleanly
**Severity: High**

Checkout has an end-to-end time budget (see document 05). Every external call
it makes has a timeout shorter than that budget and a defined fallback.

*Why:* a checkout killed part-way through leaves the customer with no answer and
the shop with no record of what completed. Slowness must degrade into a
defined outcome, not an abrupt death.

*Broken when:* checkout is terminated by a timeout rather than returning a
result, or an external call is allowed to run longer than the budget allows.

### BR-ORD-07 — A shipping quote never blocks an order
**Severity: Medium**

If the carrier is slow or unavailable, checkout applies a standard rate and
proceeds. A quote is an optimisation, not a dependency.

---

## Pricing and money — `BR-PRC`

### BR-PRC-01 — Displayed total equals charged total
**Severity: Critical**

The amount shown to the customer before they commit is exactly the amount
recorded on the order. To the cent. Every time.

*Why:* any gap, however small, is a customer being charged something they did
not agree to.

*Broken when:* the order total differs from the total the customer was shown,
by any amount.

### BR-PRC-02 — Money is computed in integer cents
**Severity: Critical**

All monetary arithmetic is performed on whole cents. No total may depend on
floating-point representation.

*Why:* accumulating fractional currency drifts. It stays invisible on a
two-line basket and shows up on a large one — and it shows up as a reconciliation
gap nobody can explain, months later.

*Broken when:* a total differs from the exact sum of its line totals, at any
number of decimal places.

### BR-PRC-03 — Round once, at the end
**Severity: High**

Rounding happens once, on the final amount. Intermediate values are never
rounded.

### BR-PRC-04 — Discount stacking is deterministic
**Severity: Critical**

When more than one discount code applies, they are applied in a fixed,
documented order that is a property of the codes — never of the order the
customer happened to type them in.

*Why:* the same basket with the same codes must cost the same. If the sequence
changes the price, then two customers are quoted different amounts for the same
purchase and neither figure can be defended.

*Broken when:* re-ordering the same set of codes changes the total.

### BR-PRC-05 — A total is never negative
**Severity: High**

Discounts that exceed the subtotal floor the total at zero.

### BR-PRC-06 — Prices are captured at purchase
**Severity: High**

An order records the price at the moment of purchase. Later catalogue changes
never alter a past order.

---

## Sessions — `BR-SES`

### BR-SES-01 — Expired is distinguishable from never-authenticated
**Severity: High**

The system tells the two apart and says which happened.

*Why:* "your session expired, your basket is safe" and "you were never signed
in" lead the shopper to different actions. A single generic rejection leaves
them stuck.

*Broken when:* an expired session produces the same undifferentiated failure as
an absent one.

### BR-SES-02 — Expiry is recovered from without losing the basket
**Severity: High**

The system attempts to re-establish the session automatically. If that fails,
the shopper is told, and the basket and any entered discount codes survive.

*Why:* losing a full basket to an idle timeout is an abandoned sale.

### BR-SES-03 — A session identifies a basket and nothing more
**Severity: Medium**

Sessions carry no personal data.

---

## Audit — `BR-AUD`

### BR-AUD-01 — Every confirmed order has exactly one audit record
**Severity: Critical**

Confirming an order and recording it are one outcome, not two independent
attempts.

*Why:* the audit record is what finance reconciles against. An order that exists
for the customer but not in the record is revenue that cannot be accounted for.

*Broken when:* a confirmed order has no audit record, or has more than one.

### BR-AUD-02 — An order that cannot be recorded is not confirmed
**Severity: Critical**

If the audit record cannot be written, the customer is not told the order
succeeded.

*Why:* the dangerous version of this failure is the quiet one — the customer
gets a confirmation, the shop's records do not, and nobody finds out until a
reconciliation months later. Failing loudly costs one sale; failing quietly
costs the ability to trust the books.

*Broken when:* an order is confirmed to the customer while its audit write
failed, whether the failure was swallowed, logged and ignored, or retried
without success.

### BR-AUD-03 — Audit records are write-once
**Severity: High**

Never modified, never deleted.

---

## Observability — `BR-OBS`

### BR-OBS-01 — Every failure is recorded
**Severity: High**

Any operation that fails, including one that is caught and handled, leaves a
record identifying what failed, for which order or session, and why.

*Why:* a swallowed failure is a defect that only surfaces as a customer
complaint.

### BR-OBS-02 — Failures carry enough detail to act on
**Severity: Medium**

A record identifies the operation, the affected order or session, and the
underlying cause. "Something went wrong" is not a record.

### BR-OBS-03 — Failures surface without a customer reporting them
**Severity: High**

Failures reach the operator on their own. Nobody should learn about a defect
first from the person it happened to.

### BR-OBS-04 — Every failure is reported, not just the first
**Severity: Medium**

Reporting must not collapse repeated or simultaneous failures into a single
notification. Frequency is itself information: a fault occurring a hundred
times is not the same incident as one occurring once.

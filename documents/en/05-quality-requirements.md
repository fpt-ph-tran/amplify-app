# 05 — Quality Requirements and Acceptance Criteria

Measurable targets, and the checks that decide whether a rule from document 04
is satisfied.

---

## Performance

| # | Requirement | Target |
|---|---|---|
| NFR-P-01 | Catalogue loads | p95 under 1.0s, p99 under 2.0s, for up to 500 products |
| NFR-P-02 | Basket updates are acknowledged | p95 under 300ms |
| NFR-P-03 | Checkout completes end to end | p95 under 3.0s, hard budget 6.0s |
| NFR-P-04 | Catalogue cost grows sub-linearly with catalogue size | Retrieving N products issues a number of data round-trips that does not grow proportionally with N |

**On NFR-P-04.** A page that costs one round-trip per product looks fine on
thirty products and falls over on three thousand. Related data for a set of
products is fetched in batches, not one lookup per item. This is a correctness
requirement about how load scales, not a micro-optimisation.

## Reliability

| # | Requirement |
|---|---|
| NFR-R-01 | Every external call has an explicit timeout shorter than the budget of the operation containing it |
| NFR-R-02 | Every external call has a defined behaviour on failure: fall back, or fail the operation cleanly. Never hang |
| NFR-R-03 | Operations that change stock or create orders are safe to retry: retrying never produces a second effect |
| NFR-R-04 | A failure part-way through leaves no partial state — no reserved stock without an order, no order without an audit record |

## Data integrity

| # | Requirement |
|---|---|
| NFR-D-01 | All seven invariants in document 02 hold under concurrent load |
| NFR-D-02 | Concurrent writes to the same record are detected, not silently merged by last-write-wins |
| NFR-D-03 | Money is stored and computed as integer cents |

## Observability

| # | Requirement |
|---|---|
| NFR-O-01 | Every failure, including handled ones, produces a record with cause, affected order or session, and timestamp |
| NFR-O-02 | Failure records reach the operator within one minute of occurring |
| NFR-O-03 | Each occurrence is reported. Repeated failures are not collapsed into one notification |
| NFR-O-04 | A record carries enough context to diagnose without reproducing the problem |

## Security and privacy

| # | Requirement |
|---|---|
| NFR-S-01 | No personal data is collected or stored |
| NFR-S-02 | Every component holds only the permissions it needs. A missing permission is a deployment defect, never something to work around at runtime |
| NFR-S-03 | Internal identifiers and error details are never exposed to shoppers |

---

# Acceptance criteria

Given / When / Then, each mapped to the rule it proves.

## Catalogue

**AC-01** — `BR-CAT-01`
> **Given** the catalogue cannot be retrieved
> **When** a shopper opens the storefront
> **Then** an explicit error is shown, and it is not presented as an empty shop

**AC-02** — `BR-CAT-02`
> **Given** a product with stock 0
> **When** the shopper views it
> **Then** it is marked sold out and cannot be added

**AC-03** — `BR-CAT-03`
> **Given** a product with no ratings
> **When** it is displayed
> **Then** no score is shown, and it does not read as 0.0

## Basket

**AC-04** — `BR-CRT-01`
> **Given** a basket containing a product
> **When** the shopper sets the quantity to −2
> **Then** it is rejected with a message, nothing is saved, and no checkout can be started from it

**AC-05** — `BR-CRT-01`
> **Given** a basket line
> **When** the quantity is set to 0
> **Then** it is rejected, or the line is removed — never stored as a zero-quantity line

**AC-06** — `BR-CRT-03`
> **Given** one session's basket open in two tabs, both showing quantity 1
> **When** tab A sets it to 9 and tab B sets it to 2 within the same second
> **Then** the conflict is detected and reported to at least one tab
> **And** neither change is discarded without the shopper being told

**AC-07** — `BR-CRT-04`
> **Given** a product with stock 3
> **When** the shopper sets the quantity to 5
> **Then** it is rejected and the available quantity is stated

## Inventory

**AC-08** — `BR-INV-01`, `BR-INV-02`
> **Given** a product with stock 1
> **When** two checkouts for that unit are submitted simultaneously
> **Then** exactly one is confirmed, the other is told it is sold out
> **And** stock ends at 0, never below

**AC-09** — `BR-INV-04`
> **Given** any purchase
> **When** it completes
> **Then** stock is lower than before, never higher

**AC-10** — `BR-INV-03`
> **Given** a checkout that fails after stock was reserved
> **When** it returns
> **Then** stock is back to its pre-checkout value and no order exists

## Checkout

**AC-11** — `BR-ORD-01`, `BR-ORD-02`
> **Given** a basket ready to check out
> **When** the shopper double-clicks the submit button
> **Then** exactly one order exists and the customer is charged once

**AC-12** — `BR-ORD-01`
> **Given** a submission that already produced an order
> **When** the identical request is replayed with the same idempotency key
> **Then** the original order is returned, and no second order is created

**AC-13** — `BR-ORD-03`
> **Given** a checkout referencing a product id that does not exist
> **When** it is submitted
> **Then** it is rejected with a message naming the problem, not an unexpected internal error

**AC-14** — `BR-ORD-06`, `BR-ORD-07`
> **Given** the shipping quote takes longer than its timeout
> **When** the shopper checks out
> **Then** the standard rate is applied and the order completes within its budget

**AC-15** — `BR-ORD-04`
> **Given** a two-line basket where the second line cannot be fulfilled
> **When** it is submitted
> **Then** no order is created and no stock is committed for either line

## Pricing

**AC-16** — `BR-PRC-01`
> **Given** any basket
> **When** the order is confirmed
> **Then** the recorded total equals the total shown before submitting, to the cent

**AC-17** — `BR-PRC-02`, `BR-PRC-03`
> **Given** a basket of 30 line items with prices ending in odd cents
> **When** the total is computed
> **Then** it equals the exact sum of the line totals, with no drift

**AC-18** — `BR-PRC-04`
> **Given** a basket and two combinable discount codes
> **When** the codes are entered in one order, and then the same two in the reverse order
> **Then** both produce the same total

**AC-19** — `BR-PRC-05`
> **Given** discounts larger than the subtotal
> **When** the total is computed
> **Then** it is zero, not negative

**AC-20** — `BR-PRC-06`
> **Given** a confirmed order
> **When** the product's catalogue price later changes
> **Then** the order still shows the price paid at purchase

## Sessions

**AC-21** — `BR-SES-01`, `BR-SES-02`
> **Given** a full basket and a session that has expired
> **When** the shopper submits the order
> **Then** they are told specifically that the session expired
> **And** the basket and entered discount codes are still there afterwards

**AC-22** — `BR-SES-01`
> **Given** a request with no session at all
> **When** it is submitted
> **Then** the message differs from the expired-session message

## Audit

**AC-23** — `BR-AUD-01`
> **Given** a confirmed order
> **When** the records are inspected
> **Then** exactly one audit record exists for it, matching the amount charged

**AC-24** — `BR-AUD-02`
> **Given** the audit record cannot be written
> **When** the shopper checks out
> **Then** the order is not confirmed to them, and the failure is reported

## Observability

**AC-25** — `BR-OBS-01`, `BR-OBS-02`
> **Given** any handled failure
> **When** it occurs
> **Then** a record exists naming the operation, the affected order or session, and the cause

**AC-26** — `BR-OBS-04`
> **Given** the same failure occurring five times in a minute
> **When** the operator looks
> **Then** all five occurrences are visible, not collapsed into one

**AC-27** — `BR-OBS-03`
> **Given** a failure occurring in production
> **When** no customer reports it
> **Then** the operator is still notified of it

## Remaining rules

**AC-28** — `BR-CAT-04`
> **Given** a product whose stock has changed
> **When** the catalogue is next retrieved
> **Then** the stock shown is the currently available quantity

**AC-29** — `BR-CRT-02`
> **Given** a basket already containing a product
> **When** the same product is added again
> **Then** the existing line's quantity increases, and the basket still has one line for that product

**AC-30** — `BR-ORD-05`
> **Given** a confirmed order
> **When** any attempt is made to alter its lines, quantities or total
> **Then** the order is unchanged

**AC-31** — `BR-SES-03`
> **Given** a session
> **When** its stored content is inspected
> **Then** it contains no personal data — only what is needed to identify the basket

**AC-32** — `BR-AUD-03`
> **Given** an existing audit record
> **When** any attempt is made to modify or delete it
> **Then** the record is unchanged and the attempt is reported

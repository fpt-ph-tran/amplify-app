# 03 — User Journeys

Each journey lists the happy path first, then the paths that matter more: what
happens when something goes wrong. A journey is only complete when its
exception flows are handled as described.

---

## J-01 — Browse the catalogue

**Actor:** Shopper
**Goal:** See what is for sale.

**Main flow**

1. Shopper opens the storefront.
2. The system shows every product with its name, description, image, price,
   stock level and rating.
3. Products with low stock are visibly marked so.
4. Products with zero stock are shown as sold out and cannot be added.

**Exception flows**

| # | Situation | Required behaviour |
|---|---|---|
| E1 | The catalogue cannot be loaded | Show an explicit error. Never show an empty catalogue as if the shop had no products |
| E2 | A product has no rating | Show the product without a score. Do not show it as zero |
| E3 | The catalogue is genuinely empty | Say so plainly, distinct from E1 |

**Postconditions** — Nothing has changed. Browsing has no side effects.

---

## J-02 — Add an item to the basket

**Actor:** Shopper
**Precondition:** The product has stock available.

**Main flow**

1. Shopper chooses a product and adds it.
2. The system adds one unit to the basket, or increases the existing line for
   that product by one.
3. The basket count updates immediately and visibly.

**Exception flows**

| # | Situation | Required behaviour |
|---|---|---|
| E1 | The product sold out between page load and the click | Refuse, and tell the shopper it is now sold out |
| E2 | Adding would exceed available stock | Refuse the excess and say how many are available |
| E3 | The basket cannot be saved | Tell the shopper. Never leave the screen showing an item that was not saved |

---

## J-03 — Change the basket

**Actor:** Shopper

**Main flow**

1. Shopper opens the basket and sees every line with its quantity and line
   total, plus the subtotal.
2. Shopper edits a quantity or removes a line.
3. Totals recalculate immediately.
4. The change is saved.

**Exception flows**

| # | Situation | Required behaviour |
|---|---|---|
| E1 | Quantity entered is zero, negative, or not a whole number | Reject before saving, with a message saying what is allowed |
| E2 | Quantity exceeds available stock | Reject, and say how many are available |
| E3 | **The same basket was changed elsewhere at the same time** (another tab or device) | Detect the conflict. Either merge or tell the shopper their change could not be applied. **Never silently overwrite the other change** |
| E4 | The basket cannot be saved | Tell the shopper and keep their input on screen |

**Note on E3.** A session's basket is shared state. Two tabs open on the same
basket is ordinary customer behaviour, not an edge case. A change that is
accepted on screen and then lost is worse than a change that is refused.

---

## J-04 — Apply a discount code

**Actor:** Shopper
**Precondition:** The basket is not empty.

**Main flow**

1. Shopper enters one or more discount codes at checkout.
2. The system validates each code.
3. Discounts are applied in a **defined, published order** that does not depend
   on the order the shopper typed them.
4. The new total is shown, together with the discount applied.

**Exception flows**

| # | Situation | Required behaviour |
|---|---|---|
| E1 | A code is unknown or expired | Say which code was rejected and why. Keep the valid ones applied |
| E2 | Two codes cannot be combined | Say so and state which one was applied |
| E3 | Discounts exceed the subtotal | Floor the total at zero. Never produce a negative total |

**Note on step 3.** For a given basket and a given set of codes, the total must
be the same every time — regardless of the order the codes were entered, and
regardless of which of two shoppers entered them.

---

## J-05 — Place an order

**Actor:** Shopper
**Precondition:** The basket is not empty and the session is valid.

**Main flow**

1. Shopper reviews the basket and the total.
2. Shopper submits the order.
3. The system:
   a. validates every line against current stock;
   b. computes the total from current prices and the applied discounts;
   c. obtains a shipping quote;
   d. reserves stock;
   e. creates the order as `confirmed`;
   f. writes the audit record.
4. Confirmation is shown with the order reference and the amount charged.
5. The basket is emptied.

**Exception flows**

| # | Situation | Required behaviour |
|---|---|---|
| E1 | **The shopper submits more than once** (double-click, retry, refresh) | Exactly one order is created. Subsequent submissions of the same intent return the original order, and do not charge again |
| E2 | **Two shoppers buy the last unit at the same time** | Exactly one succeeds. The other is told it is sold out. Stock never goes below zero |
| E3 | A line refers to a product that no longer exists | Reject with a clear message naming the product. Not an unexpected error |
| E4 | A quantity is invalid | Reject before anything is reserved |
| E5 | The shipping quote is slow or unavailable | Do not fail the order for this alone. Apply a timeout, fall back to a standard rate, and proceed |
| E6 | **The session expired between opening checkout and paying** | Tell the shopper their session expired, keep the basket intact, and let them continue after re-establishing it. Never discard the basket |
| E7 | **The audit record cannot be written** | The order is **not** confirmed to the customer. An order that cannot be recorded has not happened |
| E8 | Any step after stock reservation fails | Release the reserved stock. Never leave stock committed against an order that does not exist |

**Postconditions on success** — Exactly one `confirmed` order exists; stock has
been reduced by exactly the ordered quantities; exactly one audit record
exists; the basket is empty.

**Postconditions on failure** — No order exists; stock is unchanged; no audit
record; the basket is untouched and the shopper knows it failed.

---

## J-06 — Session expires

**Actor:** Shopper
**Trigger:** The session is no longer valid, typically after being idle.

**Main flow**

1. Shopper acts after the session expired.
2. The system recognises **specifically** that the session expired — as opposed
   to never having existed.
3. It attempts to re-establish the session without involving the shopper.
4. If that succeeds, the original action proceeds and the shopper notices
   nothing.

**Exception flows**

| # | Situation | Required behaviour |
|---|---|---|
| E1 | The session cannot be re-established | Tell the shopper their session expired **and that their basket is safe**. Offer to continue |
| E2 | It expires mid-checkout | Same as E1. The basket and any entered discount codes survive |

**Note.** "Expired" and "never authenticated" are different problems with
different remedies. A message that cannot tell them apart leaves the shopper
with no idea what to do, and is treated as a defect.

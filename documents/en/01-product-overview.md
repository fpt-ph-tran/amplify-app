# 01 — Product Overview

## Vision

QuickCart is a small online storefront. A visitor arrives, browses a catalogue
of physical goods, puts items in a basket, optionally applies a discount code,
and pays. There is no account creation step and no saved payment method: the
shortest possible path from landing to a confirmed order.

The product succeeds when a customer can complete that path without ever
wondering whether it worked — the price they were shown is the price they pay,
the item they bought is actually in stock, and pressing the button twice does
not cost them twice.

## Who uses it

| Persona | Description | What they need |
|---|---|---|
| **Shopper** | Anonymous visitor, arrives from search or a link. Does not sign in. | See what is available and what it costs, buy it in under a minute, be certain of what was charged. |
| **Store operator** | Runs the shop day to day. | Trust that stock counts reflect reality and that every order has a record. |
| **Support agent** | Handles "I was charged twice" / "my order vanished" contacts. | For any order, be able to reconstruct exactly what happened and when. |
| **Finance / audit** | Reconciles revenue periodically. | A complete, immutable record of every order, matching what customers were charged. |

## Scope

### In scope

- Browsing a product catalogue with prices, stock levels and ratings
- A basket that survives navigation within the visit
- Adjusting quantities and removing items
- Discount codes, including combining more than one
- Placing an order and receiving immediate confirmation
- Recording every order for audit

### Out of scope

- Real payment capture — an order is confirmed without money moving
- Shipping, fulfilment and delivery tracking
- Returns and refunds
- Customer accounts, order history, saved addresses
- Multi-currency; all amounts are USD
- Tax calculation
- Stock replenishment workflows

## What "done" looks like

| Goal | Measure |
|---|---|
| Customers trust the price | The total shown before paying equals the amount recorded on the order, to the cent, every time |
| Customers are never double-charged | One customer intent produces exactly one order, no matter how many times the button is pressed |
| Stock is honest | The catalogue never offers an item it cannot fulfil, and stock never falls below zero |
| Nothing is silently lost | Any operation that cannot be completed tells the customer, rather than appearing to succeed |
| Problems are visible | Every failure is recorded with enough detail to explain what went wrong, without a customer having to report it |

## Glossary

| Term | Meaning |
|---|---|
| **Session** | An anonymous visitor identity, held for the duration of the visit. Identifies whose basket is whose; no personal data attached. |
| **Catalogue** | The list of products offered for sale, with current price, stock and rating. |
| **Product** | A single sellable item. Has a name, description, price, image, and a stock count. |
| **Stock** | The number of units currently available to sell. |
| **Rating** | An aggregate customer score for a product: an average value and the number of ratings it came from. |
| **Basket** (cart) | The set of items a shopper has selected but not yet paid for, with a quantity per item. |
| **Line item** | One product plus a quantity within a basket or order. |
| **Line total** | Unit price × quantity for a single line item. |
| **Subtotal** | The sum of all line totals, before discounts. |
| **Discount code** | A code entered at checkout that reduces the amount payable. |
| **Order total** | The final amount the customer is charged, after discounts. |
| **Order** | A confirmed purchase. Immutable once created. |
| **Idempotency key** | A value identifying one purchase intent, so that repeated submissions of the same intent cannot create more than one order. |
| **Audit record** | The permanent record written for every order, used for reconciliation. |
| **Shipping quote** | An estimate of delivery cost obtained from a carrier during checkout. |

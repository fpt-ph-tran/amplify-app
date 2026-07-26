# QuickCart — Product Specification

Business specification for **QuickCart**, an online storefront. Written from
the product owner's side: it states what the system is *required* to do, not
how it is built.

Available in three languages. The English set is the source of truth; the other
two are translations of it.

| Language | Folder |
|---|---|
| English | [`en/`](en/) |
| Tiếng Việt | [`vi/`](vi/) |
| 日本語 | [`ja/`](ja/) |

## Contents

| # | Document | What it covers |
|---|---|---|
| 01 | Product overview | Vision, users, scope, glossary |
| 02 | Domain model | Entities, attributes, lifecycles, 7 invariants |
| 03 | User journeys | 6 flows, each with its failure paths |
| 04 | Business rules | 35 numbered, testable rules the system must uphold |
| 05 | Quality requirements | 18 measurable targets and 32 acceptance criteria |

Every business rule in document 04 has at least one acceptance criterion in
document 05 that decides whether it is met.

## How to read a rule

Every rule in document 04 has a stable identifier:

```
BR-<AREA>-<NN>
```

| Prefix | Area |
|---|---|
| `BR-CAT` | Catalog and product browsing |
| `BR-CRT` | Shopping cart |
| `BR-INV` | Inventory and stock |
| `BR-ORD` | Checkout and orders |
| `BR-PRC` | Pricing, discounts, money handling |
| `BR-SES` | Sessions and authentication |
| `BR-AUD` | Audit and record keeping |
| `BR-OBS` | Observability |

Each rule states the requirement, why it exists, and what the business
consequence is if it is not met. Rule identifiers are stable — quote them when
reporting a defect so the requirement being violated is unambiguous.

## Severity

| Level | Meaning |
|---|---|
| **Critical** | Money or stock is wrong, or a customer is charged incorrectly. Stop the line. |
| **High** | A customer cannot complete a purchase, or data is silently lost. |
| **Medium** | The experience degrades but the customer can still transact. |
| **Low** | Cosmetic or internal-only. |

## Status

This specification describes the **intended** behaviour of QuickCart. It is not
a description of the current implementation, and it deliberately makes no claim
that the system currently satisfies every rule. Where reality and this document
disagree, this document is the requirement and the difference is a defect.

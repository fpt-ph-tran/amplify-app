/**
 * Source of truth for every user-visible string. Keys are flat and dotted;
 * `vi.ts` and `ja.ts` are typed against this object, so adding a key here and
 * forgetting to translate it is a compile error rather than an English word
 * showing up mid-sentence in another language.
 *
 * `{placeholders}` are substituted by `t()` — see ./index.ts.
 */
export const en = {
  "lang.name.en": "English",
  "lang.name.vi": "Tiếng Việt",
  "lang.name.ja": "日本語",
  "lang.switch": "Change language",

  "nav.shop": "Shop",
  "nav.cart": "Cart",
  "nav.chaos": "Chaos Panel",
  "nav.theme.toLight": "Switch to light theme",
  "nav.theme.toDark": "Switch to dark theme",
  "footer.tagline":
    "QuickCart is a demo storefront with ten deliberate production bugs — every failure here is real and streams straight out of CloudWatch Logs to Cowork Local.",

  "home.eyebrow": "Demo storefront",
  "home.title": "Everything here works. That's the problem.",
  "home.subtitle":
    "Shop normally and you will hit real production bugs — oversold stock, duplicate charges, prices that change depending on the order you type coupons in. Each one is genuine backend code, and each failure is shipped to Cowork Local.",
  "home.reload": "Reload catalog",
  "home.reloading": "Loading catalog…",
  "home.lastLoad": "last load {ms}ms · 1 Scan + {count} rating lookups",
  "home.loadFailed": "Failed to load catalog: {error}",
  "home.oversoldTitle": "Negative stock detected",
  "home.oversoldBody": "on {names} — that is bug #1, sold past zero.",
  "home.badge.oversold": "{stock} oversold",
  "home.badge.soldOut": "Sold out",
  "home.badge.onlyLeft": "Only {stock} left",
  "home.inStock": "{stock} in stock",
  "home.addToCart": "Add to cart",
  "home.added": "Added ✓",
  "home.empty": "No products yet — run {command} to populate the catalog.",

  "cart.title": "Your cart",
  "cart.empty": "Nothing here yet.",
  "cart.summary": "{count} line items · synced to the shared cart row",
  "cart.reload": "Reload from server",
  "cart.emptyBody": "Your cart is empty.",
  "cart.browse": "Browse the shop",
  "cart.each": "${price} each",
  "cart.remove": "Remove",
  "cart.quantityFor": "Quantity for {name}",
  "cart.subtotal": "Subtotal",
  "cart.checkout": "Proceed to checkout",
  "cart.hint":
    "Quantities are saved with a plain last-write-wins update. Open this page in two tabs and change the number in both — one of them vanishes silently.",
  "cart.sync.saving": "saving to the shared cart row…",
  "cart.sync.saved": "saved {time}",
  "cart.sync.inSync": "in sync",
  "cart.sync.error": "cart backend unreachable — local only",
  "cart.serverHolds": "server holds qty {qty} for line 1",
  "cart.peer.title": "Second tab — same cart",
  "cart.peer.body":
    "This tab just wrote quantity {qty} to the shared cart row. The other tab is writing a different number at the same moment. Whichever lands last wins, and the other change disappears without any conflict error.",
  "cart.peer.saving": "saving…",
  "cart.peer.saved": "saved at {time}",
  "cart.peer.waiting": "waiting for the cart to load…",

  "checkout.title": "Checkout",
  "checkout.session": "Session",
  "checkout.tokenExpired": "· token expired",
  "checkout.summary": "Order summary",
  "checkout.totalShown": "Total shown to you",
  "checkout.coupon": "Coupon code",
  "checkout.couponPlaceholder": "SAVE10, FLAT5 — or both, comma separated",
  "checkout.couponHint": "Codes are applied left to right. {a} and {b} do not cost the same.",
  "checkout.express": "Express shipping",
  "checkout.expressHint": "Fetches a live carrier quote at checkout. The call can take up to 8s.",
  "checkout.youPay": "You pay",
  "checkout.placeOrder": "Place order",
  "checkout.placing": "Placing order… ({count} in flight)",
  "checkout.expireSession": "Simulate an idle-timeout (expire my session)",
  "checkout.sessionStale": "Session is stale",
  "checkout.emptyBody": "Nothing to check out — your cart is empty.",
  "checkout.result.confirmed": "Order confirmed",
  "checkout.result.multi": "{ok} of {total} requests created an order",
  "checkout.result.failed": "Checkout failed",
  "checkout.result.charged": "Server charged",
  "checkout.result.drift": "page showed ${shown} — off by {cents} cents",
  "checkout.result.order": "order {id}",
  "checkout.result.duplicate": "Both carried idempotency key {key}… — duplicate charge.",
  "checkout.footnote":
    "Every failure on this page is real backend behaviour, forwarded to Cowork Local through CloudWatch.",

  "chaos.eyebrow": "Chaos panel",
  "chaos.title": "Ten bugs, on demand",
  "chaos.intro.a": "Run in UI",
  "chaos.intro.b":
    "hands the browser to an autopilot: it walks the real storefront, clicks the real buttons and types into the real inputs until the bug happens in front of you.",
  "chaos.intro.c": "Trigger",
  "chaos.intro.d": "skips the screen and calls the Lambda directly — faster, but there is nothing to watch.",
  "chaos.driving": "Autopilot is driving — watch the panel in the corner.",
  "chaos.runInUI": "Run in UI",
  "chaos.running": "Running…",
  "chaos.trigger": "Trigger",
  "chaos.onScreen": "On screen:",
  "chaos.restock": "Restock the catalogue",
  "chaos.restocking": "Restocking…",
  "chaos.restocked": "Restocked {count} products. Reload the shop to see them.",
  "chaos.restockFailed": "Could not restock: {error}",
  "chaos.restockHint":
    "Runs drain stock and can push it below zero. Use this between demos to put the shop back in a sellable state.",
  "chaos.pipeline.title": "How a failure reaches Cowork Local",
  "chaos.pipeline.body":
    "The Lambda logs the error → a CloudWatch Logs subscription filter matches the line and ships the event itself → the log-forwarder Lambda posts it to the Bugs Hunter webhook. Arrives within seconds, with the real message and stack trace, one delivery per occurrence.",

  "hud.title": "Chaos autopilot",
  "hud.finished": "Run finished",
  "hud.starting": "Starting…",
  "hud.hide": "Hide",
  "hud.show": "Show",
  "hud.stop": "Stop",
  "hud.close": "Close",
  "hud.driving": "Driving the real UI for #{num} — {title}.",
  "hud.stopped": "Run stopped.",

  "step.openShop": "Open the storefront",
  "step.openCart": "Open the cart",
  "step.checkout": "Proceed to checkout",
  "step.addFirst": "Add the first product to the cart",
  "step.rebuildCart": "Rebuild the same cart",
  "step.goto": "Go to {path}",

  "bug1.title": "Oversell the last units",
  "bug1.what":
    "Stock is decremented without a conditional write, so two checkouts for the same last units both pass.",
  "bug1.screen":
    "Adds a product, sets the quantity to everything left in stock, then double-clicks Place order so two checkouts race.",
  "bug1.stockNote": '"{name}" has {stock} unit(s) left.',
  "bug1.add": "Add it to the cart",
  "bug1.setQty": "Set quantity to all {stock} remaining",
  "bug1.doubleClick": "Double-click Place order — two checkouts race",
  "bug1.both":
    'Both concurrent checkouts for all {stock} unit(s) of "{name}" succeeded — stock can now go negative. Reload the catalog to see it.',
  "bug1.partial":
    "{ok}/2 checkouts succeeded. Re-run on a product with more stock, or check the catalog for a negative count.",

  "bug2.title": "Duplicate order on double-click",
  "bug2.what":
    "The idempotency key is sent but never checked server-side, so an impatient double-click bills twice.",
  "bug2.screen":
    "Puts one item in the cart and double-clicks Place order — the page never disables the button, so both requests go out with the same key.",
  "bug2.keyNote": "Checkout is holding idempotency key {key}… for this cart.",
  "bug2.doubleClick": "Double-click Place order",
  "bug2.both":
    "Both requests carried the SAME idempotency key and both created an order — that is a duplicate charge.",
  "bug2.partial":
    "{ok}/2 requests succeeded — the second was not rejected by any dedupe check, it just lost a race.",

  "bug3.title": "Audit log silently fails (IAM)",
  "bug3.what":
    "The checkout role has no s3:PutObject on the audit bucket, so every order loses its audit trail while the customer sees success.",
  "bug3.screen":
    "Buys one item completely normally. The order confirms on screen — the failure is only visible in CloudWatch.",
  "bug3.place": "Place a perfectly ordinary order",
  "bug3.ok":
    "Order confirmed on screen. The s3:PutObject AccessDenied happened server-side — the customer will never know the audit record is missing.",
  "bug3.failed": "Checkout failed before reaching the audit write — check the result panel.",

  "bug4.title": "Lost cart update across tabs",
  "bug4.what":
    "The cart is saved with a plain last-write-wins update, so one tab silently clobbers the other's change.",
  "bug4.screen":
    "Opens a SECOND browser tab on the cart. Both tabs change the quantity within the same moment; only one survives.",
  "bug4.openTab": "Open a second tab on the same cart",
  "bug4.blocked": "The browser blocked the second tab. Allow pop-ups for this site and run it again.",
  "bug4.opened": "Second tab opened — it will write quantity 9 to the server.",
  "bug4.setQty": "This tab sets quantity to 2 at the same time",
  "bug4.reread": "Re-read the cart from the server",
  "bug4.reload": "Reload the cart from the server",
  "bug4.result":
    "Two tabs wrote 9 and 2 within the same second; the server kept {qty}. The other tab's change vanished with no conflict error.",

  "bug5.title": "Coupon math depends on order",
  "bug5.what":
    "SAVE10 (10% off) and FLAT5 (−$5) are applied in separate ifs, so the order they are listed in changes the price.",
  "bug5.screen":
    "Checks out the same cart twice — once with SAVE10,FLAT5 and once with FLAT5,SAVE10 — and compares the totals.",
  "bug5.setQty": "Set quantity to 3",
  "bug5.setQtyAgain": "Set quantity to 3 again",
  "bug5.enterA": 'Enter coupon "SAVE10,FLAT5"',
  "bug5.enterB": "Enter the SAME coupons, reversed",
  "bug5.place": "Place the order",
  "bug5.noteA": "SAVE10 then FLAT5 → {total}",
  "bug5.noteB": "FLAT5 then SAVE10 → {total}",
  "bug5.differ":
    "Same cart, same two coupons, different price: {a} vs {b} — a {diff} swing decided by string order.",
  "bug5.same": "Totals came back {a} and {b}. Check the result panels above.",

  "bug6.title": "Floating-point rounding drift",
  "bug6.what":
    "Line totals accumulate as raw JS floats and are never rounded to cents, so the total drifts from the sum of what is shown.",
  "bug6.screen":
    "Adds a basket full of items, then compares the total the page shows against the total the server charges.",
  "bug6.fill": "Fill the basket with many line items",
  "bug6.addNth": "Add product {n} (pass {round}/3)",
  "bug6.basket": "Basket now spans {count} products × 3 passes.",
  "bug6.place": "Place the order",
  "bug6.drift": "The page showed {shown} but the server charged {charged} — off by {cents} cents.",
  "bug6.noDrift":
    "Page {shown} vs server {charged} — no visible drift on this basket. Add more odd-priced items and re-run.",
  "bug6.fallback": "Order placed — compare the two totals in the result panel.",

  "bug7.title": "Negative quantity is accepted",
  "bug7.what":
    "Quantity is never validated, so a negative number subtracts a negative — the checkout ADDS stock back and skews the total.",
  "bug7.screen": "Types −2 straight into the cart's quantity box and checks out. Nothing rejects it.",
  "bug7.before": "Quantity box currently reads {qty}.",
  "bug7.setQty": "Type a NEGATIVE quantity: −2",
  "bug7.place": "Place the order anyway",
  "bug7.ok":
    "Accepted a quantity of −2 and returned a total of {total}. Reload the catalog: that product's stock went UP.",
  "bug7.threw":
    "The checkout threw on the negative quantity — an unhandled 500 rather than a clean validation error.",

  "bug8.title": "Lambda dies on the shipping quote",
  "bug8.what":
    "The live carrier quote can take 8s against a 6s Lambda timeout — the function is killed mid-flight with no cleanup.",
  "bug8.screen":
    'Ticks the real "Express shipping — live carrier quote" option at checkout, then places the order and waits for it to die.',
  "bug8.tick": "Tick Express shipping (live carrier quote)",
  "bug8.place": "Place the order and wait out the carrier call",
  "bug8.survived":
    "The quote came back inside the timeout this time — re-run it, the delay is randomised up to 8s.",
  "bug8.died":
    "The Lambda was killed mid-checkout. The customer just sees a failure, and any partial work is left behind.",

  "bug9.title": "Session expires mid-checkout",
  "bug9.what":
    "An expired token is not distinguished from never having signed in — the customer is bounced with a generic Unauthorized.",
  "bug9.screen":
    'Uses the checkout\'s "Expire my session" control (what a real idle timeout would do), then tries to pay.',
  "bug9.expire": "Let the session go stale",
  "bug9.place": "Try to pay with the stale session",
  "bug9.ok": "Checkout unexpectedly succeeded with a stale session.",
  "bug9.failed":
    "Generic Unauthorized, no refresh attempt, and no 'your cart is saved' path — the customer loses their place.",

  "bug10.title": "N+1 query behind the catalog",
  "bug10.what":
    "The catalog Lambda scans all products, then does a separate GetItem per product for its rating.",
  "bug10.screen":
    "Reloads the storefront from the server a few times so the fan-out is visible in CloudWatch and in the load time.",
  "bug10.reload": "Reload the catalog ({i}/3)",
  "bug10.result":
    "{products} products, average round-trip {ms}ms — each reload is 1 Scan + {products} separate rating GetItem calls.",

  "headless.noProduct": "No product loaded yet.",
} as const;

export type TranslationKey = keyof typeof en;
export type Dictionary = Record<TranslationKey, string>;

"use client";

import { client, getSessionId } from "@/lib/client";

/**
 * Every scenario below drives the REAL storefront: it navigates the router,
 * scrolls real buttons into view, clicks them, and types into real inputs. The
 * bug then happens the same way it would for a customer — nothing here calls
 * a Lambda behind the UI's back (that is what `headless` is for).
 *
 * Elements are addressed through `data-chaos` attributes so the pages stay
 * free to change their markup.
 */

export interface ChaosApi {
  /** Client-side navigation; resolves once the new route has painted. */
  goto(path: string, label?: string): Promise<void>;
  waitFor(selector: string, timeoutMs?: number): Promise<HTMLElement>;
  /** Highlight, scroll to, and genuinely click an element. */
  click(selector: string, label: string): Promise<void>;
  /** Same, for the nth match — used when a page renders a grid of them. */
  clickNth(selector: string, index: number, label: string): Promise<void>;
  /** Two clicks a few ms apart — a real impatient double-click. */
  doubleClick(selector: string, label: string): Promise<void>;
  /** Type into a real input so React's onChange fires. */
  fill(selector: string, value: string, label: string): Promise<void>;
  read(selector: string, attr: string): Promise<string | null>;
  readAll(selector: string, attr: string): Promise<(string | null)[]>;
  exists(selector: string): boolean;
  step(label: string): void;
  log(tone: "info" | "ok" | "warn" | "err" | "step", text: string): void;
  pause(ms: number): Promise<void>;
  openPeerTab(path: string): Window | null;
  throwIfCancelled(): void;
}

export interface Scenario {
  id: string;
  num: number;
  title: string;
  /** One line on what goes wrong. */
  what: string;
  /** What the audience will literally watch happen on screen. */
  onScreen: string;
  steps: number;
  run: (api: ChaosApi) => Promise<{ ok: boolean; text: string }>;
  /** The old one-shot path: calls the Lambda directly, no UI involved. */
  headless?: () => Promise<string>;
}

const money = (n: number) => `$${n.toFixed(2)}`;

/** Pull the server's reported total out of the checkout result panel. */
async function serverTotal(api: ChaosApi): Promise<number | null> {
  const raw = await api.read('[data-chaos="order-result"]', "data-total");
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function addFirstProduct(api: ChaosApi, label = "Add the first product to the cart") {
  await api.goto("/", "Open the storefront");
  await api.waitFor('[data-chaos="product"]');
  await api.click('[data-chaos="add-to-cart"]', label);
}

/** Shared opening for the checkout-based scenarios. */
async function toCheckoutWithOneItem(api: ChaosApi) {
  await addFirstProduct(api);
  await api.goto("/cart", "Open the cart");
  await api.click('[data-chaos="to-checkout"]', "Proceed to checkout");
  await api.waitFor('[data-chaos="place-order"]');
}

export const scenarios: Scenario[] = [
  {
    id: "oversell",
    num: 1,
    title: "Oversell the last units",
    what: "Stock is decremented without a conditional write, so two checkouts for the same last units both pass.",
    onScreen:
      "Adds a product, sets the quantity to everything left in stock, then double-clicks Place order so two checkouts race.",
    steps: 6,
    run: async (api) => {
      await api.goto("/", "Open the storefront");
      await api.waitFor('[data-chaos="product"]');
      const stock = Number((await api.read('[data-chaos="product"]', "data-stock")) ?? "0");
      const name = (await api.read('[data-chaos="product"]', "data-name")) ?? "the product";
      api.log("info", `"${name}" has ${stock} unit(s) left.`);
      await api.click('[data-chaos="add-to-cart"]', "Add it to the cart");

      await api.goto("/cart", "Open the cart");
      await api.fill('[data-chaos="qty-input"]', String(Math.max(stock, 1)), `Set quantity to all ${stock} remaining`);
      await api.click('[data-chaos="to-checkout"]', "Proceed to checkout");

      await api.waitFor('[data-chaos="place-order"]');
      await api.doubleClick('[data-chaos="place-order"]', "Double-click Place order — two checkouts race");
      await api.waitFor('[data-chaos="order-result"]', 20000);
      await api.pause(400);

      const okCount = await api.read('[data-chaos="order-result"]', "data-ok-count");
      if (okCount === "2") {
        return {
          ok: true,
          text: `Both concurrent checkouts for all ${stock} unit(s) of "${name}" succeeded — stock can now go negative. Reload the catalog to see it.`,
        };
      }
      return {
        ok: true,
        text: `${okCount ?? "?"}/2 checkouts succeeded. Re-run on a product with more stock, or check the catalog for a negative count.`,
      };
    },
    headless: async () => {
      const res = await client.queries.getCatalog({});
      const items = (res.data as { items?: { id: string; name: string; stock: number }[] } | null)?.items ?? [];
      const p = items[0];
      if (!p) return "No product loaded yet.";
      const args = { sessionId: getSessionId(), items: [{ productId: p.id, quantity: p.stock }] };
      const [a, b] = await Promise.all([client.mutations.checkout(args), client.mutations.checkout(args)]);
      const okCount = [a, b].filter((r) => !r.errors?.length).length;
      return `${okCount}/2 concurrent checkouts for all ${p.stock} unit(s) of "${p.name}" succeeded.`;
    },
  },

  {
    id: "duplicate-order",
    num: 2,
    title: "Duplicate order on double-click",
    what: "The idempotency key is sent but never checked server-side, so an impatient double-click bills twice.",
    onScreen:
      "Puts one item in the cart and double-clicks Place order — the page never disables the button, so both requests go out with the same key.",
    steps: 5,
    run: async (api) => {
      await toCheckoutWithOneItem(api);
      const key = await api.read('[data-chaos="idempotency-key"]', "data-key");
      api.log("info", `Checkout is holding idempotency key ${key?.slice(0, 8)}… for this cart.`);
      await api.doubleClick('[data-chaos="place-order"]', "Double-click Place order");
      await api.waitFor('[data-chaos="order-result"]', 20000);
      await api.pause(400);

      const okCount = await api.read('[data-chaos="order-result"]', "data-ok-count");
      return {
        ok: true,
        text:
          okCount === "2"
            ? "Both requests carried the SAME idempotency key and both created an order — that is a duplicate charge."
            : `${okCount ?? "?"}/2 requests succeeded — the second was not rejected by any dedupe check, it just lost a race.`,
      };
    },
    headless: async () => {
      const res = await client.queries.getCatalog({});
      const p = (res.data as { items?: { id: string }[] } | null)?.items?.[0];
      if (!p) return "No product loaded yet.";
      const args = {
        sessionId: getSessionId(),
        items: [{ productId: p.id, quantity: 1 }],
        idempotencyKey: crypto.randomUUID(),
      };
      const [a, b] = await Promise.all([client.mutations.checkout(args), client.mutations.checkout(args)]);
      return `${[a, b].filter((r) => !r.errors?.length).length}/2 requests with the SAME idempotency key succeeded.`;
    },
  },

  {
    id: "audit-accessdenied",
    num: 3,
    title: "Audit log silently fails (IAM)",
    what: "The checkout role has no s3:PutObject on the audit bucket, so every order loses its audit trail while the customer sees success.",
    onScreen: "Buys one item completely normally. The order confirms on screen — the failure is only visible in CloudWatch.",
    steps: 5,
    run: async (api) => {
      await toCheckoutWithOneItem(api);
      await api.click('[data-chaos="place-order"]', "Place a perfectly ordinary order");
      await api.waitFor('[data-chaos="order-result"]', 20000);
      const ok = (await api.read('[data-chaos="order-result"]', "data-ok")) === "true";
      return {
        ok: true,
        text: ok
          ? "Order confirmed on screen. The s3:PutObject AccessDenied happened server-side — the customer will never know the audit record is missing."
          : "Checkout failed before reaching the audit write — check the result panel.",
      };
    },
    headless: async () => {
      const res = await client.queries.getCatalog({});
      const p = (res.data as { items?: { id: string }[] } | null)?.items?.[0];
      if (!p) return "No product loaded yet.";
      await client.mutations.checkout({ sessionId: getSessionId(), items: [{ productId: p.id, quantity: 1 }] });
      return "Checkout ran — check CloudWatch Logs for the AccessDenied on s3:PutObject.";
    },
  },

  {
    id: "lost-cart-update",
    num: 4,
    title: "Lost cart update across tabs",
    what: "The cart is saved with a plain last-write-wins update, so one tab silently clobbers the other's change.",
    onScreen:
      "Opens a SECOND browser tab on the cart. Both tabs change the quantity within the same moment; only one survives.",
    steps: 6,
    run: async (api) => {
      await addFirstProduct(api);
      await api.goto("/cart", "Open the cart");
      await api.waitFor('[data-chaos="qty-input"]');

      api.step("Open a second tab on the same cart");
      const peer = api.openPeerTab("/cart?chaos=peer&qty=9");
      if (!peer) {
        return {
          ok: false,
          text: "The browser blocked the second tab. Allow pop-ups for this site and run it again.",
        };
      }
      api.log("info", "Second tab opened — it will write quantity 9 to the server.");
      await api.pause(1600);

      await api.fill('[data-chaos="qty-input"]', "2", "This tab sets quantity to 2 at the same time");
      await api.pause(2000);

      api.step("Re-read the cart from the server");
      await api.click('[data-chaos="reload-cart"]', "Reload the cart from the server");
      await api.pause(1200);
      const winner = await api.read('[data-chaos="qty-input"]', "value");
      const serverQty = (await api.read('[data-chaos="cart-server-qty"]', "data-qty")) ?? winner;

      try {
        peer.close();
      } catch {
        /* the peer may already be gone */
      }

      return {
        ok: true,
        text: `Two tabs wrote 9 and 2 within the same second; the server kept ${serverQty}. The other tab's change vanished with no conflict error.`,
      };
    },
  },

  {
    id: "coupon-order",
    num: 5,
    title: "Coupon math depends on order",
    what: "SAVE10 (10% off) and FLAT5 (−$5) are applied in separate ifs, so the order they are listed in changes the price.",
    onScreen: "Checks out the same cart twice — once with SAVE10,FLAT5 and once with FLAT5,SAVE10 — and compares the totals.",
    steps: 8,
    run: async (api) => {
      await addFirstProduct(api);
      await api.goto("/cart", "Open the cart");
      await api.fill('[data-chaos="qty-input"]', "3", "Set quantity to 3");
      await api.click('[data-chaos="to-checkout"]', "Proceed to checkout");

      await api.fill('[data-chaos="coupon-input"]', "SAVE10,FLAT5", 'Enter coupon "SAVE10,FLAT5"');
      await api.click('[data-chaos="place-order"]', "Place the order");
      await api.waitFor('[data-chaos="order-result"]', 20000);
      const totalA = await serverTotal(api);
      api.log("info", `SAVE10 then FLAT5 → ${totalA == null ? "n/a" : money(totalA)}`);

      await addFirstProduct(api, "Rebuild the same cart");
      await api.goto("/cart", "Open the cart");
      await api.fill('[data-chaos="qty-input"]', "3", "Set quantity to 3 again");
      await api.click('[data-chaos="to-checkout"]', "Proceed to checkout");
      await api.fill('[data-chaos="coupon-input"]', "FLAT5,SAVE10", 'Enter the SAME coupons, reversed');
      await api.click('[data-chaos="place-order"]', "Place the order");
      await api.waitFor('[data-chaos="order-result"]', 20000);
      const totalB = await serverTotal(api);
      api.log("info", `FLAT5 then SAVE10 → ${totalB == null ? "n/a" : money(totalB)}`);

      if (totalA != null && totalB != null && totalA !== totalB) {
        return {
          ok: true,
          text: `Same cart, same two coupons, different price: ${money(totalA)} vs ${money(totalB)} — a ${money(Math.abs(totalA - totalB))} swing decided by string order.`,
        };
      }
      return {
        ok: true,
        text: `Totals came back ${totalA == null ? "n/a" : money(totalA)} and ${totalB == null ? "n/a" : money(totalB)}. Check the result panels above.`,
      };
    },
    headless: async () => {
      const res = await client.queries.getCatalog({});
      const p = (res.data as { items?: { id: string }[] } | null)?.items?.[0];
      if (!p) return "No product loaded yet.";
      const r = await client.mutations.checkout({
        sessionId: getSessionId(),
        items: [{ productId: p.id, quantity: 3 }],
        couponCode: "SAVE10,FLAT5",
      });
      return `Total returned: ${JSON.stringify(r.data)}`;
    },
  },

  {
    id: "rounding-drift",
    num: 6,
    title: "Floating-point rounding drift",
    what: "Line totals accumulate as raw JS floats and are never rounded to cents, so the total drifts from the sum of what is shown.",
    onScreen: "Adds a basket full of items, then compares the total the page shows against the total the server charges.",
    steps: 6,
    run: async (api) => {
      await api.goto("/", "Open the storefront");
      await api.waitFor('[data-chaos="product"]');

      api.step("Fill the basket with many line items");
      const count = Math.min(document.querySelectorAll('[data-chaos="add-to-cart"]').length, 8);
      for (let round = 1; round <= 3; round++) {
        for (let i = 0; i < count; i++) {
          api.throwIfCancelled();
          await api.clickNth('[data-chaos="add-to-cart"]', i, `Add product ${i + 1} (pass ${round}/3)`);
        }
      }
      api.log("info", `Basket now spans ${count} products × 3 passes.`);

      await api.goto("/cart", "Open the cart");
      await api.click('[data-chaos="to-checkout"]', "Proceed to checkout");
      const shown = Number((await api.read('[data-chaos="client-total"]', "data-total")) ?? "NaN");
      await api.click('[data-chaos="place-order"]', "Place the order");
      await api.waitFor('[data-chaos="order-result"]', 25000);
      const charged = await serverTotal(api);

      if (charged != null && Number.isFinite(shown)) {
        const diff = Math.abs(charged - shown);
        return {
          ok: true,
          text:
            diff > 0.0001
              ? `The page showed ${money(shown)} but the server charged ${money(charged)} — off by ${(diff * 100).toFixed(4)} cents.`
              : `Page ${money(shown)} vs server ${money(charged)} — no visible drift on this basket. Add more odd-priced items and re-run.`,
        };
      }
      return { ok: true, text: "Order placed — compare the two totals in the result panel." };
    },
  },

  {
    id: "invalid-quantity",
    num: 7,
    title: "Negative quantity is accepted",
    what: "Quantity is never validated, so a negative number subtracts a negative — the checkout ADDS stock back and skews the total.",
    onScreen: "Types −2 straight into the cart's quantity box and checks out. Nothing rejects it.",
    steps: 6,
    run: async (api) => {
      await addFirstProduct(api);
      await api.goto("/cart", "Open the cart");
      const before = await api.read('[data-chaos="qty-input"]', "value");
      api.log("info", `Quantity box currently reads ${before}.`);
      await api.fill('[data-chaos="qty-input"]', "-2", "Type a NEGATIVE quantity: −2");
      await api.click('[data-chaos="to-checkout"]', "Proceed to checkout");
      await api.click('[data-chaos="place-order"]', "Place the order anyway");
      await api.waitFor('[data-chaos="order-result"]', 20000);

      const ok = (await api.read('[data-chaos="order-result"]', "data-ok")) === "true";
      const total = await serverTotal(api);
      return {
        ok: true,
        text: ok
          ? `Accepted a quantity of −2 and returned a total of ${total == null ? "n/a" : money(total)}. Reload the catalog: that product's stock went UP.`
          : "The checkout threw on the negative quantity — an unhandled 500 rather than a clean validation error.",
      };
    },
    headless: async () => {
      const r = await client.mutations.checkout({
        sessionId: getSessionId(),
        items: [{ productId: "does-not-exist", quantity: 1 }],
      });
      return r.errors?.length ? `Failed as expected: ${r.errors[0].message}` : "Unexpectedly succeeded.";
    },
  },

  {
    id: "shipping-timeout",
    num: 8,
    title: "Lambda dies on the shipping quote",
    what: "The live carrier quote can take 8s against a 6s Lambda timeout — the function is killed mid-flight with no cleanup.",
    onScreen: 'Ticks the real "Express shipping — live carrier quote" option at checkout, then places the order and waits for it to die.',
    steps: 6,
    run: async (api) => {
      await toCheckoutWithOneItem(api);
      await api.click('[data-chaos="express-shipping"]', "Tick Express shipping (live carrier quote)");
      await api.click('[data-chaos="place-order"]', "Place the order and wait out the carrier call");
      await api.waitFor('[data-chaos="order-result"]', 30000);
      const ok = (await api.read('[data-chaos="order-result"]', "data-ok")) === "true";
      return {
        ok: true,
        text: ok
          ? "The quote came back inside the timeout this time — re-run it, the delay is randomised up to 8s."
          : "The Lambda was killed mid-checkout. The customer just sees a failure, and any partial work is left behind.",
      };
    },
    headless: async () => {
      const res = await client.queries.getCatalog({});
      const p = (res.data as { items?: { id: string }[] } | null)?.items?.[0];
      if (!p) return "No product loaded yet.";
      const r = await client.mutations.checkout({
        sessionId: getSessionId(),
        items: [{ productId: p.id, quantity: 1 }],
        simulateSlowShipping: true,
      });
      return r.errors?.length ? `Timed out as expected: ${r.errors[0].message}` : "Unexpectedly succeeded.";
    },
  },

  {
    id: "expired-session",
    num: 9,
    title: "Session expires mid-checkout",
    what: "An expired token is not distinguished from never having signed in — the customer is bounced with a generic Unauthorized.",
    onScreen: 'Uses the checkout\'s "Expire my session" control (what a real idle timeout would do), then tries to pay.',
    steps: 6,
    run: async (api) => {
      await toCheckoutWithOneItem(api);
      await api.click('[data-chaos="expire-session"]', "Let the session go stale");
      await api.click('[data-chaos="place-order"]', "Try to pay with the stale session");
      await api.waitFor('[data-chaos="order-result"]', 20000);
      const ok = (await api.read('[data-chaos="order-result"]', "data-ok")) === "true";
      return {
        ok: true,
        text: ok
          ? "Checkout unexpectedly succeeded with a stale session."
          : "Generic Unauthorized, no refresh attempt, and no 'your cart is saved' path — the customer loses their place.",
      };
    },
    headless: async () => {
      const res = await client.queries.getCatalog({});
      const p = (res.data as { items?: { id: string }[] } | null)?.items?.[0];
      if (!p) return "No product loaded yet.";
      const r = await client.mutations.checkout({
        sessionId: getSessionId(),
        items: [{ productId: p.id, quantity: 1 }],
        simulateExpiredToken: true,
      });
      return r.errors?.length ? `Unauthorized as expected: ${r.errors[0].message}` : "Unexpectedly succeeded.";
    },
  },

  {
    id: "n-plus-one",
    num: 10,
    title: "N+1 query behind the catalog",
    what: "The catalog Lambda scans all products, then does a separate GetItem per product for its rating.",
    onScreen: "Reloads the storefront from the server a few times so the fan-out is visible in CloudWatch and in the load time.",
    steps: 5,
    run: async (api) => {
      await api.goto("/", "Open the storefront");
      await api.waitFor('[data-chaos="product"]');
      const timings: number[] = [];
      for (let i = 1; i <= 3; i++) {
        api.throwIfCancelled();
        const t0 = performance.now();
        await api.click('[data-chaos="reload-catalog"]', `Reload the catalog (${i}/3)`);
        await api.pause(200);
        await api.waitFor('[data-chaos="product"]', 20000);
        timings.push(performance.now() - t0);
      }
      const products = document.querySelectorAll('[data-chaos="product"]').length;
      const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
      return {
        ok: true,
        text: `${products} products, average round-trip ${avg.toFixed(0)}ms — each reload is 1 Scan + ${products} separate rating GetItem calls.`,
      };
    },
    headless: async () => {
      const res = await client.queries.getCatalog({});
      const count = (res.data as { items?: unknown[] } | null)?.items?.length ?? 0;
      return `Reloaded ${count} products — check CloudWatch for ${count} separate rating GetItem calls.`;
    },
  },
];

export const scenarioById = (id: string) => scenarios.find((s) => s.id === id);

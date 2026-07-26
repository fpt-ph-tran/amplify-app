"use client";

import { checkoutMutation, client, getSessionId, parseJson } from "@/lib/client";
import type { TranslationKey, Translate } from "@/lib/i18n";

/**
 * Every scenario below drives the REAL storefront: it navigates the router,
 * scrolls real buttons into view, clicks them, and types into real inputs. The
 * bug then happens the same way it would for a customer — nothing here calls
 * a Lambda behind the UI's back (that is what `headless` is for).
 *
 * Elements are addressed through `data-chaos` attributes so the pages stay
 * free to change their markup. Every string the operator sees goes through
 * `api.t`, so a run narrates itself in whatever language the app is set to.
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
  t: Translate;
}

export interface Scenario {
  id: string;
  num: number;
  titleKey: TranslationKey;
  /** One line on what goes wrong. */
  whatKey: TranslationKey;
  /** What the audience will literally watch happen on screen. */
  screenKey: TranslationKey;
  steps: number;
  run: (api: ChaosApi) => Promise<{ ok: boolean; text: string }>;
  /** The old one-shot path: calls the Lambda directly, no UI involved. */
  headless?: (t: Translate) => Promise<string>;
}

const money = (n: number) => `$${n.toFixed(2)}`;

/** Pull the server's reported total out of the checkout result panel. */
async function serverTotal(api: ChaosApi): Promise<number | null> {
  const raw = await api.read('[data-chaos="order-result"]', "data-total");
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** The first product on the catalog, added to the cart. */
async function addFirstProduct(api: ChaosApi, label = api.t("step.addFirst")) {
  await api.goto("/", api.t("step.openShop"));
  await api.waitFor('[data-chaos="product"]');
  await api.click('[data-chaos="add-to-cart"]', label);
}

/** Shared opening for the checkout-based scenarios. */
async function toCheckoutWithOneItem(api: ChaosApi) {
  await addFirstProduct(api);
  await api.goto("/cart", api.t("step.openCart"));
  await api.click('[data-chaos="to-checkout"]', api.t("step.checkout"));
  await api.waitFor('[data-chaos="place-order"]');
}

/** Every headless path needs a product id; they all fetch it the same way. */
async function firstProduct(): Promise<{ id: string; name: string; stock: number } | null> {
  const res = await client.queries.getCatalog({});
  const items =
    parseJson<{ items?: { id: string; name: string; stock: number }[] }>(res.data)?.items ?? [];
  return items[0] ?? null;
}

export const scenarios: Scenario[] = [
  {
    id: "oversell",
    num: 1,
    titleKey: "bug1.title",
    whatKey: "bug1.what",
    screenKey: "bug1.screen",
    steps: 6,
    run: async (api) => {
      const { t } = api;
      await api.goto("/", t("step.openShop"));
      await api.waitFor('[data-chaos="product"]');
      const stock = Number((await api.read('[data-chaos="product"]', "data-stock")) ?? "0");
      const name = (await api.read('[data-chaos="product"]', "data-name")) ?? "?";
      api.log("info", t("bug1.stockNote", { name, stock }));
      await api.click('[data-chaos="add-to-cart"]', t("bug1.add"));

      await api.goto("/cart", t("step.openCart"));
      await api.fill(
        '[data-chaos="qty-input"]',
        String(Math.max(stock, 1)),
        t("bug1.setQty", { stock }),
      );
      await api.click('[data-chaos="to-checkout"]', t("step.checkout"));

      await api.waitFor('[data-chaos="place-order"]');
      await api.doubleClick('[data-chaos="place-order"]', t("bug1.doubleClick"));
      await api.waitFor('[data-chaos="order-result"]', 20000);
      await api.pause(400);

      const okCount = await api.read('[data-chaos="order-result"]', "data-ok-count");
      return {
        ok: true,
        text:
          okCount === "2"
            ? t("bug1.both", { stock, name })
            : t("bug1.partial", { ok: okCount ?? "?" }),
      };
    },
    headless: async (t) => {
      const p = await firstProduct();
      if (!p) return t("headless.noProduct");
      const args = { sessionId: getSessionId(), items: [{ productId: p.id, quantity: p.stock }] };
      const [a, b] = await Promise.all([checkoutMutation(args), checkoutMutation(args)]);
      const ok = [a, b].filter((r) => !r.errors?.length).length;
      return ok === 2 ? t("bug1.both", { stock: p.stock, name: p.name }) : t("bug1.partial", { ok });
    },
  },

  {
    id: "duplicate-order",
    num: 2,
    titleKey: "bug2.title",
    whatKey: "bug2.what",
    screenKey: "bug2.screen",
    steps: 5,
    run: async (api) => {
      const { t } = api;
      await toCheckoutWithOneItem(api);
      const key = await api.read('[data-chaos="idempotency-key"]', "data-key");
      api.log("info", t("bug2.keyNote", { key: key?.slice(0, 8) ?? "?" }));
      await api.doubleClick('[data-chaos="place-order"]', t("bug2.doubleClick"));
      await api.waitFor('[data-chaos="order-result"]', 20000);
      await api.pause(400);

      const okCount = await api.read('[data-chaos="order-result"]', "data-ok-count");
      return {
        ok: true,
        text: okCount === "2" ? t("bug2.both") : t("bug2.partial", { ok: okCount ?? "?" }),
      };
    },
    headless: async (t) => {
      const p = await firstProduct();
      if (!p) return t("headless.noProduct");
      const args = {
        sessionId: getSessionId(),
        items: [{ productId: p.id, quantity: 1 }],
        idempotencyKey: crypto.randomUUID(),
      };
      const [a, b] = await Promise.all([checkoutMutation(args), checkoutMutation(args)]);
      const ok = [a, b].filter((r) => !r.errors?.length).length;
      return ok === 2 ? t("bug2.both") : t("bug2.partial", { ok });
    },
  },

  {
    id: "audit-accessdenied",
    num: 3,
    titleKey: "bug3.title",
    whatKey: "bug3.what",
    screenKey: "bug3.screen",
    steps: 5,
    run: async (api) => {
      const { t } = api;
      await toCheckoutWithOneItem(api);
      await api.click('[data-chaos="place-order"]', t("bug3.place"));
      await api.waitFor('[data-chaos="order-result"]', 20000);
      const ok = (await api.read('[data-chaos="order-result"]', "data-ok")) === "true";
      return { ok: true, text: ok ? t("bug3.ok") : t("bug3.failed") };
    },
    headless: async (t) => {
      const p = await firstProduct();
      if (!p) return t("headless.noProduct");
      await checkoutMutation({ sessionId: getSessionId(), items: [{ productId: p.id, quantity: 1 }] });
      return t("bug3.ok");
    },
  },

  {
    id: "lost-cart-update",
    num: 4,
    titleKey: "bug4.title",
    whatKey: "bug4.what",
    screenKey: "bug4.screen",
    steps: 6,
    run: async (api) => {
      const { t } = api;
      await addFirstProduct(api);
      await api.goto("/cart", t("step.openCart"));
      await api.waitFor('[data-chaos="qty-input"]');

      api.step(t("bug4.openTab"));
      const peer = api.openPeerTab("/cart?chaos=peer&qty=9");
      if (!peer) return { ok: false, text: t("bug4.blocked") };
      api.log("info", t("bug4.opened"));
      await api.pause(1600);

      await api.fill('[data-chaos="qty-input"]', "2", t("bug4.setQty"));
      await api.pause(2000);

      api.step(t("bug4.reread"));
      await api.click('[data-chaos="reload-cart"]', t("bug4.reload"));
      await api.pause(1200);
      const winner = await api.read('[data-chaos="qty-input"]', "value");
      const serverQty = (await api.read('[data-chaos="cart-server-qty"]', "data-qty")) ?? winner;

      try {
        peer.close();
      } catch {
        /* the peer may already be gone */
      }

      return { ok: true, text: t("bug4.result", { qty: serverQty ?? "?" }) };
    },
  },

  {
    id: "coupon-order",
    num: 5,
    titleKey: "bug5.title",
    whatKey: "bug5.what",
    screenKey: "bug5.screen",
    steps: 8,
    run: async (api) => {
      const { t } = api;
      await addFirstProduct(api);
      await api.goto("/cart", t("step.openCart"));
      await api.fill('[data-chaos="qty-input"]', "3", t("bug5.setQty"));
      await api.click('[data-chaos="to-checkout"]', t("step.checkout"));

      await api.fill('[data-chaos="coupon-input"]', "SAVE10,FLAT5", t("bug5.enterA"));
      await api.click('[data-chaos="place-order"]', t("bug5.place"));
      await api.waitFor('[data-chaos="order-result"]', 20000);
      const totalA = await serverTotal(api);
      api.log("info", t("bug5.noteA", { total: totalA == null ? "n/a" : money(totalA) }));

      await addFirstProduct(api, t("step.rebuildCart"));
      await api.goto("/cart", t("step.openCart"));
      await api.fill('[data-chaos="qty-input"]', "3", t("bug5.setQtyAgain"));
      await api.click('[data-chaos="to-checkout"]', t("step.checkout"));
      await api.fill('[data-chaos="coupon-input"]', "FLAT5,SAVE10", t("bug5.enterB"));
      await api.click('[data-chaos="place-order"]', t("bug5.place"));
      await api.waitFor('[data-chaos="order-result"]', 20000);
      const totalB = await serverTotal(api);
      api.log("info", t("bug5.noteB", { total: totalB == null ? "n/a" : money(totalB) }));

      if (totalA != null && totalB != null && totalA !== totalB) {
        return {
          ok: true,
          text: t("bug5.differ", {
            a: money(totalA),
            b: money(totalB),
            diff: money(Math.abs(totalA - totalB)),
          }),
        };
      }
      return {
        ok: true,
        text: t("bug5.same", {
          a: totalA == null ? "n/a" : money(totalA),
          b: totalB == null ? "n/a" : money(totalB),
        }),
      };
    },
    headless: async (t) => {
      const p = await firstProduct();
      if (!p) return t("headless.noProduct");
      const call = (code: string) =>
        checkoutMutation({
          sessionId: getSessionId(),
          items: [{ productId: p.id, quantity: 3 }],
          couponCode: code,
        });
      const a = parseJson<{ total?: number }>((await call("SAVE10,FLAT5")).data);
      const b = parseJson<{ total?: number }>((await call("FLAT5,SAVE10")).data);
      if (typeof a?.total === "number" && typeof b?.total === "number" && a.total !== b.total) {
        return t("bug5.differ", {
          a: money(a.total),
          b: money(b.total),
          diff: money(Math.abs(a.total - b.total)),
        });
      }
      return t("bug5.same", {
        a: a?.total == null ? "n/a" : money(a.total),
        b: b?.total == null ? "n/a" : money(b.total),
      });
    },
  },

  {
    id: "rounding-drift",
    num: 6,
    titleKey: "bug6.title",
    whatKey: "bug6.what",
    screenKey: "bug6.screen",
    steps: 6,
    run: async (api) => {
      const { t } = api;
      await api.goto("/", t("step.openShop"));
      await api.waitFor('[data-chaos="product"]');

      api.step(t("bug6.fill"));
      const count = Math.min(document.querySelectorAll('[data-chaos="add-to-cart"]').length, 8);
      for (let round = 1; round <= 3; round++) {
        for (let i = 0; i < count; i++) {
          api.throwIfCancelled();
          await api.clickNth('[data-chaos="add-to-cart"]', i, t("bug6.addNth", { n: i + 1, round }));
        }
      }
      api.log("info", t("bug6.basket", { count }));

      await api.goto("/cart", t("step.openCart"));
      await api.click('[data-chaos="to-checkout"]', t("step.checkout"));
      const shown = Number((await api.read('[data-chaos="client-total"]', "data-total")) ?? "NaN");
      await api.click('[data-chaos="place-order"]', t("bug6.place"));
      await api.waitFor('[data-chaos="order-result"]', 25000);
      const charged = await serverTotal(api);

      if (charged != null && Number.isFinite(shown)) {
        const diff = Math.abs(charged - shown);
        return {
          ok: true,
          text:
            diff > 0.0001
              ? t("bug6.drift", {
                  shown: money(shown),
                  charged: money(charged),
                  cents: (diff * 100).toFixed(4),
                })
              : t("bug6.noDrift", { shown: money(shown), charged: money(charged) }),
        };
      }
      return { ok: true, text: t("bug6.fallback") };
    },
  },

  {
    id: "invalid-quantity",
    num: 7,
    titleKey: "bug7.title",
    whatKey: "bug7.what",
    screenKey: "bug7.screen",
    steps: 6,
    run: async (api) => {
      const { t } = api;
      await addFirstProduct(api);
      await api.goto("/cart", t("step.openCart"));
      const before = await api.read('[data-chaos="qty-input"]', "value");
      api.log("info", t("bug7.before", { qty: before ?? "?" }));
      await api.fill('[data-chaos="qty-input"]', "-2", t("bug7.setQty"));
      await api.click('[data-chaos="to-checkout"]', t("step.checkout"));
      await api.click('[data-chaos="place-order"]', t("bug7.place"));
      await api.waitFor('[data-chaos="order-result"]', 20000);

      const ok = (await api.read('[data-chaos="order-result"]', "data-ok")) === "true";
      const total = await serverTotal(api);
      return {
        ok: true,
        text: ok ? t("bug7.ok", { total: total == null ? "n/a" : money(total) }) : t("bug7.threw"),
      };
    },
    headless: async (t) => {
      const r = await checkoutMutation({
        sessionId: getSessionId(),
        items: [{ productId: "does-not-exist", quantity: 1 }],
      });
      return r.errors?.length ? t("bug7.threw") : t("bug7.ok", { total: "n/a" });
    },
  },

  {
    id: "shipping-timeout",
    num: 8,
    titleKey: "bug8.title",
    whatKey: "bug8.what",
    screenKey: "bug8.screen",
    steps: 6,
    run: async (api) => {
      const { t } = api;
      await toCheckoutWithOneItem(api);
      await api.click('[data-chaos="express-shipping"]', t("bug8.tick"));
      await api.click('[data-chaos="place-order"]', t("bug8.place"));
      await api.waitFor('[data-chaos="order-result"]', 30000);
      const ok = (await api.read('[data-chaos="order-result"]', "data-ok")) === "true";
      return { ok: true, text: ok ? t("bug8.survived") : t("bug8.died") };
    },
    headless: async (t) => {
      const p = await firstProduct();
      if (!p) return t("headless.noProduct");
      const r = await checkoutMutation({
        sessionId: getSessionId(),
        items: [{ productId: p.id, quantity: 1 }],
        simulateSlowShipping: true,
      });
      return r.errors?.length ? t("bug8.died") : t("bug8.survived");
    },
  },

  {
    id: "expired-session",
    num: 9,
    titleKey: "bug9.title",
    whatKey: "bug9.what",
    screenKey: "bug9.screen",
    steps: 6,
    run: async (api) => {
      const { t } = api;
      await toCheckoutWithOneItem(api);
      await api.click('[data-chaos="expire-session"]', t("bug9.expire"));
      await api.click('[data-chaos="place-order"]', t("bug9.place"));
      await api.waitFor('[data-chaos="order-result"]', 20000);
      const ok = (await api.read('[data-chaos="order-result"]', "data-ok")) === "true";
      return { ok: true, text: ok ? t("bug9.ok") : t("bug9.failed") };
    },
    headless: async (t) => {
      const p = await firstProduct();
      if (!p) return t("headless.noProduct");
      const r = await checkoutMutation({
        sessionId: getSessionId(),
        items: [{ productId: p.id, quantity: 1 }],
        simulateExpiredToken: true,
      });
      return r.errors?.length ? t("bug9.failed") : t("bug9.ok");
    },
  },

  {
    id: "n-plus-one",
    num: 10,
    titleKey: "bug10.title",
    whatKey: "bug10.what",
    screenKey: "bug10.screen",
    steps: 5,
    run: async (api) => {
      const { t } = api;
      await api.goto("/", t("step.openShop"));
      await api.waitFor('[data-chaos="product"]');
      const timings: number[] = [];
      for (let i = 1; i <= 3; i++) {
        api.throwIfCancelled();
        const t0 = performance.now();
        await api.click('[data-chaos="reload-catalog"]', t("bug10.reload", { i }));
        await api.pause(200);
        await api.waitFor('[data-chaos="product"]', 20000);
        timings.push(performance.now() - t0);
      }
      const products = document.querySelectorAll('[data-chaos="product"]').length;
      const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
      return { ok: true, text: t("bug10.result", { products, ms: avg.toFixed(0) }) };
    },
    headless: async (t) => {
      const started = performance.now();
      const res = await client.queries.getCatalog({});
      const products = parseJson<{ items?: unknown[] }>(res.data)?.items?.length ?? 0;
      return t("bug10.result", { products, ms: (performance.now() - started).toFixed(0) });
    },
  },
];

export const scenarioById = (id: string) => scenarios.find((s) => s.id === id);

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { client, getCart, getSessionId, setCart, type CartItem } from "@/lib/client";

interface Attempt {
  ok: boolean;
  total: number | null;
  orderId: string | null;
  error: string | null;
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [express, setExpress] = useState(false);
  const [sessionStale, setSessionStale] = useState(false);
  const [inFlight, setInFlight] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [settled, setSettled] = useState(false);

  // One key for the whole checkout, the way a real client would mint it when
  // the page opens. Two clicks therefore send the SAME key — and the server
  // never checks it (bug #2). Minted after mount so the prerendered HTML and
  // the hydrated tree agree.
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [sessionId, setSessionId] = useState("");
  const pending = useRef(0);

  useEffect(() => {
    setItems(getCart());
    setSessionId(getSessionId());
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  const clientTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const busy = inFlight > 0;

  async function placeOrder() {
    // A fresh burst of clicks starts a fresh result panel.
    if (settled) {
      setAttempts([]);
      setSettled(false);
    }
    pending.current += 1;
    setInFlight(pending.current);

    const args = {
      sessionId: getSessionId(),
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      couponCode: coupon || undefined,
      idempotencyKey,
      simulateSlowShipping: express || undefined,
      simulateExpiredToken: sessionStale || undefined,
    };

    let attempt: Attempt;
    try {
      const res = await client.mutations.checkout(args);
      if (res.errors?.length) {
        attempt = { ok: false, total: null, orderId: null, error: res.errors[0].message };
      } else {
        const data = res.data as { orderId?: string; total?: number } | null;
        attempt = {
          ok: true,
          total: typeof data?.total === "number" ? data.total : null,
          orderId: data?.orderId ?? null,
          error: null,
        };
      }
    } catch (err) {
      attempt = { ok: false, total: null, orderId: null, error: String(err) };
    }

    setAttempts((prev) => [...prev, attempt]);
    pending.current -= 1;
    setInFlight(pending.current);
    if (pending.current === 0) {
      setSettled(true);
      if (attempt.ok) {
        setCart([]);
      }
    }
  }

  const okCount = attempts.filter((a) => a.ok).length;
  const lastOk = [...attempts].reverse().find((a) => a.ok) ?? null;
  const firstErr = attempts.find((a) => !a.ok) ?? null;
  const showResult = settled && attempts.length > 0;
  const drift = lastOk?.total != null ? lastOk.total - clientTotal : null;

  if (items.length === 0 && !showResult) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface px-6 py-14 text-center">
        <p className="mb-4 text-4xl" aria-hidden>
          🧾
        </p>
        <p className="mb-6 text-sm text-muted">Nothing to check out — your cart is empty.</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
          <p className="mt-1 text-sm text-muted">
            Session <span className="font-mono text-xs">{sessionId.slice(0, 8) || "…"}</span>
            {sessionStale && <span className="ml-2 font-semibold text-danger">· token expired</span>}
          </p>
        </div>

        <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold">Order summary</h2>
          <ul className="divide-y divide-line">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="min-w-0 truncate">
                  {i.name} <span className="text-muted">× {i.quantity}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  ${(i.price * i.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <span className="text-sm font-semibold">Total shown to you</span>
            <span
              data-chaos="client-total"
              data-total={clientTotal}
              className="text-xl font-bold tabular-nums"
            >
              ${clientTotal.toFixed(2)}
            </span>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div>
            <label htmlFor="coupon" className="mb-1.5 block text-sm font-semibold">
              Coupon code
            </label>
            <input
              id="coupon"
              data-chaos="coupon-input"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="SAVE10, FLAT5 — or both, comma separated"
              className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
            />
            <p className="mt-1.5 text-xs text-faint">
              Codes are applied left to right. <code className="font-mono">SAVE10,FLAT5</code> and{" "}
              <code className="font-mono">FLAT5,SAVE10</code> do not cost the same.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas p-3.5">
            <input
              data-chaos="express-shipping"
              type="checkbox"
              checked={express}
              onChange={(e) => setExpress(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span className="text-sm">
              <span className="font-medium">Express shipping</span>
              <span className="block text-xs text-muted">
                Fetches a live carrier quote at checkout. The call can take up to 8s.
              </span>
            </span>
          </label>
        </section>

        <span data-chaos="idempotency-key" data-key={idempotencyKey} className="sr-only">
          {idempotencyKey}
        </span>
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className="space-y-3 rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">You pay</span>
            <span className="text-2xl font-bold tabular-nums">${clientTotal.toFixed(2)}</span>
          </div>
          {/* Deliberately never disabled: nothing here guards against a
              double-submit, which is exactly bugs #1 and #2. */}
          <button
            data-chaos="place-order"
            onClick={() => void placeOrder()}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
          >
            {busy ? `Placing order… (${inFlight} in flight)` : "Place order"}
          </button>
          <button
            data-chaos="expire-session"
            onClick={() => setSessionStale(true)}
            className="w-full rounded-xl border border-line px-4 py-2 text-xs font-medium text-muted transition hover:border-danger hover:text-danger"
          >
            {sessionStale ? "Session is stale" : "Simulate an idle-timeout (expire my session)"}
          </button>
        </div>

        {showResult && (
          <div
            data-chaos="order-result"
            data-ok={okCount > 0}
            data-ok-count={okCount}
            data-total={lastOk?.total ?? ""}
            data-order-id={lastOk?.orderId ?? ""}
            className={`rise space-y-2 rounded-2xl border p-5 text-sm shadow-card ${
              okCount > 0
                ? "border-success/30 bg-success-soft text-success"
                : "border-danger/30 bg-danger-soft text-danger"
            }`}
          >
            <p className="font-semibold">
              {okCount > 0
                ? attempts.length > 1
                  ? `${okCount} of ${attempts.length} requests created an order`
                  : "Order confirmed"
                : "Checkout failed"}
            </p>

            {lastOk?.total != null && (
              <p className="tabular-nums">
                Server charged <strong>${lastOk.total.toFixed(2)}</strong>
                {drift != null && Math.abs(drift) > 0.0001 && (
                  <span className="block text-xs opacity-80">
                    page showed ${clientTotal.toFixed(2)} — off by {(drift * 100).toFixed(4)} cents
                  </span>
                )}
              </p>
            )}
            {lastOk?.orderId && (
              <p className="font-mono text-xs opacity-80">order {lastOk.orderId}</p>
            )}
            {okCount > 1 && (
              <p className="text-xs opacity-90">
                Both carried idempotency key {idempotencyKey.slice(0, 8)}… — duplicate charge.
              </p>
            )}
            {firstErr?.error && <p className="text-xs opacity-90">{firstErr.error}</p>}
          </div>
        )}

        <p className="px-1 text-xs leading-relaxed text-faint">
          Every failure on this page is real backend behaviour, forwarded to Cowork Local through
          CloudWatch.
        </p>
      </aside>
    </div>
  );
}

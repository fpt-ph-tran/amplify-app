"use client";

import { useEffect, useState } from "react";
import { client, getCart, getSessionId, setCart, type CartItem } from "@/lib/client";

type Result = { ok: boolean; message: string } | null;

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  useEffect(() => setItems(getCart()), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function placeOrder(opts?: { doubleSubmit?: boolean }) {
    setBusy(true);
    setResult(null);
    const idempotencyKey = crypto.randomUUID();
    const args = {
      sessionId: getSessionId(),
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      couponCode: coupon || undefined,
      idempotencyKey,
    };
    try {
      const calls = opts?.doubleSubmit
        ? [client.mutations.checkout(args), client.mutations.checkout(args)]
        : [client.mutations.checkout(args)];
      const responses = await Promise.all(calls);
      const okCount = responses.filter((r) => !r.errors?.length).length;
      setResult({
        ok: okCount > 0,
        message: opts?.doubleSubmit
          ? `Fired 2 concurrent checkout requests with the SAME idempotency key — ${okCount}/2 succeeded. If both succeeded, that's Bug #2 (duplicate order created).`
          : okCount > 0
            ? "Order placed."
            : responses[0].errors?.map((e) => e.message).join("; ") || "Checkout failed.",
      });
      if (okCount > 0) {
        setCart([]);
        setItems([]);
      }
    } catch (err) {
      setResult({ ok: false, message: String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      {items.length === 0 ? (
        <p className="text-slate-400">Nothing to check out — your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            {items.map((i) => (
              <div key={i.productId} className="flex justify-between py-1 text-sm">
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Coupon code</label>
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="SAVE10, FLAT5, or SAVE10+FLAT5"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-400">
              Try combining <code>SAVE10,FLAT5</code> — see Bug #5 (order-dependent coupon math).
            </p>
          </div>

          <button
            disabled={busy}
            onClick={() => placeOrder()}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {busy ? "Placing order…" : "Place order"}
          </button>

          <button
            disabled={busy}
            onClick={() => placeOrder({ doubleSubmit: true })}
            className="w-full rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            ⚡ Simulate double-click submit (Bug #2)
          </button>

          {result && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                result.ok
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

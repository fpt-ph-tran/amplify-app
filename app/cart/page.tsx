"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Schema } from "@/amplify/data/resource";
import { client, getCart, getSessionId, setCart, type CartItem } from "@/lib/client";

type CartRow = Schema["Cart"]["type"];

/** The cart row is shared by every tab on this session — that is what makes
 * the lost update in bug #4 reachable without any special tooling. */
async function loadServerCart(sessionId: string): Promise<CartRow | null> {
  const res = await client.models.Cart.list({ filter: { sessionId: { eq: sessionId } } });
  return res.data?.[0] ?? null;
}

function CartView() {
  const router = useRouter();
  const params = useSearchParams();
  const isPeer = params.get("chaos") === "peer";
  const peerQty = Number(params.get("qty") ?? "9");

  const [items, setItems] = useState<CartItem[]>([]);
  const [rowId, setRowId] = useState<string | null>(null);
  const [serverItems, setServerItems] = useState<CartItem[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const peerRan = useRef(false);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  /** Push the whole cart up with a plain last-write-wins update — no version
   * check, no conditional write. Bug #4 lives right here. */
  const save = useCallback(
    async (next: CartItem[], id: string | null) => {
      if (!id) return;
      setSyncing(true);
      try {
        await client.models.Cart.update({
          id,
          items: next,
          updatedAt: new Date().toISOString(),
        });
        setSyncedAt(new Date().toLocaleTimeString());
      } catch {
        /* the demo keeps going even if the write is rejected */
      } finally {
        setSyncing(false);
      }
    },
    [],
  );

  const pullFromServer = useCallback(async () => {
    try {
      const row = await loadServerCart(getSessionId());
      if (!row) return null;
      const remote = (row.items as CartItem[] | null) ?? [];
      setServerItems(remote);
      return remote;
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, []);

  // Initial load: local cart is the source of truth for what you added, the
  // server row is what other tabs can clobber.
  useEffect(() => {
    let cancelled = false;
    const local = getCart();
    setItems(local);

    (async () => {
      try {
        const sessionId = getSessionId();
        let row = await loadServerCart(sessionId);
        if (!row) {
          const created = await client.models.Cart.create({
            sessionId,
            items: local,
            updatedAt: new Date().toISOString(),
          });
          row = created.data ?? null;
        }
        if (cancelled || !row) return;
        setRowId(row.id);
        setServerItems((row.items as CartItem[] | null) ?? []);
      } catch (err) {
        // No backend reachable (placeholder amplify_outputs.json, or a failed
        // deploy). The cart still works from localStorage; only the shared row
        // — and with it bug #4 — is unavailable.
        if (!cancelled) setSyncError(err instanceof Error ? err.message : String(err));
      }
    })();

    const onChange = () => setItems(getCart());
    window.addEventListener("quickcart:cart-changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("quickcart:cart-changed", onChange);
    };
  }, []);

  // Peer tab: land, immediately write a different quantity, and sit there.
  useEffect(() => {
    if (!isPeer || !rowId || peerRan.current || items.length === 0) return;
    peerRan.current = true;
    const next = items.map((i, idx) => (idx === 0 ? { ...i, quantity: peerQty } : i));
    setItems(next);
    void save(next, rowId);
  }, [isPeer, rowId, items, peerQty, save]);

  const updateQty = (productId: string, quantity: number) => {
    const next = items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    setItems(next);
    setCart(next);
    void save(next, rowId);
  };

  const remove = (productId: string) => {
    const next = items.filter((i) => i.productId !== productId);
    setItems(next);
    setCart(next);
    void save(next, rowId);
  };

  const serverQty = serverItems?.[0]?.quantity;

  if (isPeer) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-warning/40 bg-warning-soft p-6 text-center">
        <p className="text-2xl" aria-hidden>
          🪟
        </p>
        <h1 className="text-lg font-bold text-warning">Second tab — same cart</h1>
        <p className="text-sm text-warning">
          This tab just wrote <strong>quantity {peerQty}</strong> to the shared cart row. The other
          tab is writing a different number at the same moment. Whichever lands last wins, and the
          other change disappears without any conflict error.
        </p>
        <p className="font-mono text-xs text-warning/80">
          {syncing ? "saving…" : syncedAt ? `saved at ${syncedAt}` : "waiting for the cart to load…"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your cart</h1>
          <p className="mt-1 text-sm text-muted">
            {items.length === 0
              ? "Nothing here yet."
              : `${items.length} line item${items.length === 1 ? "" : "s"} · synced to the shared cart row`}
          </p>
        </div>
        <button
          data-chaos="reload-cart"
          onClick={() => void pullFromServer()}
          className="rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-fg"
        >
          Reload from server
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center">
          <p className="mb-4 text-4xl" aria-hidden>
            🛒
          </p>
          <p className="mb-6 text-sm text-muted">Your cart is empty.</p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="text-sm text-muted">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    data-chaos="qty-input"
                    data-product-id={item.productId}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                    className="w-20 rounded-xl border border-line bg-canvas px-3 py-2 text-center font-medium tabular-nums"
                    aria-label={`Quantity for ${item.name}`}
                  />
                  <span className="w-20 text-right font-semibold tabular-nums">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => remove(item.productId)}
                    className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-danger-soft hover:text-danger"
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2 px-1 text-xs text-faint">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  syncError ? "bg-danger" : syncing ? "bg-warning" : "bg-success"
                }`}
              />
              {syncError
                ? "cart backend unreachable — local only"
                : syncing
                  ? "saving to the shared cart row…"
                  : syncedAt
                    ? `saved ${syncedAt}`
                    : "in sync"}
              {serverQty != null && (
                <span data-chaos="cart-server-qty" data-qty={serverQty} className="ml-auto">
                  server holds qty {serverQty} for line 1
                </span>
              )}
            </div>
          </div>

          <aside className="h-fit space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="text-2xl font-bold tracking-tight tabular-nums">
                ${total.toFixed(2)}
              </span>
            </div>
            <button
              data-chaos="to-checkout"
              onClick={() => router.push("/checkout")}
              className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
            >
              Proceed to checkout
            </button>
            <p className="text-xs leading-relaxed text-faint">
              Quantities are saved with a plain last-write-wins update. Open this page in two tabs
              and change the number in both — one of them vanishes silently.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  // useSearchParams needs a Suspense boundary on a statically prerendered route.
  return (
    <Suspense fallback={<div className="skeleton h-40 rounded-2xl" />}>
      <CartView />
    </Suspense>
  );
}

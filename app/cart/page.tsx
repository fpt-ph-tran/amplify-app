"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart, setCart, type CartItem } from "@/lib/client";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    setItems(getCart());
    const onChange = () => setItems(getCart());
    window.addEventListener("quickcart:cart-changed", onChange);
    return () => window.removeEventListener("quickcart:cart-changed", onChange);
  }, []);

  const updateQty = (productId: string, quantity: number) => {
    const next = items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    setItems(next);
    setCart(next);
  };

  const remove = (productId: string) => {
    const next = items.filter((i) => i.productId !== productId);
    setItems(next);
    setCart(next);
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your cart</h1>
      {items.length === 0 ? (
        <p className="text-slate-400">Your cart is empty. Go add something from the catalog.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-slate-500">${item.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center"
                />
                <button
                  onClick={() => remove(item.productId)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-lg font-semibold">Subtotal</span>
            <span className="text-lg font-bold text-orange-600">${total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => router.push("/checkout")}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-orange-600"
          >
            Proceed to checkout
          </button>
          <p className="text-xs text-slate-400">
            Tip: open this cart in two browser tabs and change the quantity in both at almost the
            same time — Bug #4 (lost update). No conditional write, last save wins silently.
          </p>
        </div>
      )}
    </div>
  );
}

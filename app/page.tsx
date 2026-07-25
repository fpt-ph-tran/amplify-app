"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { client, addToCart } from "@/lib/client";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  stock: number;
  rating?: number | null;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    client.queries
      .getCatalog({})
      .then((res) => {
        if (cancelled) return;
        const items = (res.data as { items?: Product[] } | null)?.items ?? [];
        setProducts(items);
      })
      .catch((err) => !cancelled && setError(String(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Catalog</h1>
      <p className="mb-6 text-sm text-slate-500">
        {products.length} product(s) — served by the <code>catalog</code> Lambda (see Bug #10:
        N+1 rating lookups).
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load catalog: {error}
        </div>
      )}
      {loading && <p className="text-slate-400">Loading…</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative h-40 w-full bg-slate-100">
              {p.imageUrl && (
                <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h2 className="font-semibold">{p.name}</h2>
              <p className="line-clamp-2 flex-1 text-sm text-slate-500">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-orange-600">${p.price.toFixed(2)}</span>
                {p.rating != null && (
                  <span className="text-xs text-slate-400">⭐ {p.rating.toFixed(1)}</span>
                )}
              </div>
              <p className="text-xs text-slate-400">{p.stock} in stock</p>
              <button
                onClick={() => {
                  addToCart({ productId: p.id, name: p.name, price: p.price, quantity: 1 });
                  setAdded(p.id);
                  setTimeout(() => setAdded(null), 1200);
                }}
                className="mt-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
              >
                {added === p.id ? "Added ✓" : "Add to cart"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

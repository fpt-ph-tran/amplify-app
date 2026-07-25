"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [lastLoadMs, setLastLoadMs] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const started = performance.now();
    try {
      const res = await client.queries.getCatalog({});
      setProducts((res.data as { items?: Product[] } | null)?.items ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLastLoadMs(performance.now() - started);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const oversold = products.filter((p) => p.stock < 0);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface to-elevated p-8 sm:p-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Demo storefront
        </p>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Everything here works. That&apos;s the problem.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Shop normally and you will hit real production bugs — oversold stock, duplicate charges,
          prices that change depending on the order you type coupons in. Each one is genuine backend
          code, and each failure is shipped to Cowork Local.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            data-chaos="reload-catalog"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold shadow-card transition hover:border-line-strong disabled:opacity-60"
          >
            <span className={loading ? "animate-spin" : ""} aria-hidden>
              ⟳
            </span>
            {loading ? "Loading catalog…" : "Reload catalog"}
          </button>
          {lastLoadMs != null && (
            <span className="text-xs text-faint">
              last load {lastLoadMs.toFixed(0)}ms · 1 Scan + {products.length} rating lookups
            </span>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          Failed to load catalog: {error}
        </div>
      )}

      {oversold.length > 0 && (
        <div className="rise rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <strong className="font-semibold">Negative stock detected</strong> on{" "}
          {oversold.map((p) => p.name).join(", ")} — that is bug #1, sold past zero.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading && products.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="skeleton h-44 w-full" />
                <div className="space-y-3 p-5">
                  <div className="skeleton h-4 w-2/3 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-9 w-full rounded-xl" />
                </div>
              </div>
            ))
          : products.map((p) => {
              const out = p.stock <= 0;
              return (
                <article
                  key={p.id}
                  data-chaos="product"
                  data-id={p.id}
                  data-name={p.name}
                  data-price={p.price}
                  data-stock={p.stock}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-md"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-elevated">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        className="transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-3xl opacity-30" aria-hidden>
                        🛍️
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex gap-2">
                      {p.stock < 0 ? (
                        <span className="rounded-full bg-danger px-2.5 py-1 text-[11px] font-bold text-white">
                          {p.stock} oversold
                        </span>
                      ) : p.stock === 0 ? (
                        <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-semibold text-muted">
                          Sold out
                        </span>
                      ) : p.stock <= 3 ? (
                        <span className="rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning">
                          Only {p.stock} left
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold leading-tight">{p.name}</h2>
                      {p.rating != null && (
                        <span className="shrink-0 text-xs text-muted">★ {p.rating.toFixed(1)}</span>
                      )}
                    </div>
                    <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
                      {p.description}
                    </p>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xl font-bold tracking-tight">${p.price.toFixed(2)}</span>
                      <span className={`text-xs ${out ? "text-danger" : "text-faint"}`}>
                        {p.stock} in stock
                      </span>
                    </div>
                    <button
                      data-chaos="add-to-cart"
                      data-id={p.id}
                      onClick={() => {
                        addToCart({ productId: p.id, name: p.name, price: p.price, quantity: 1 });
                        setAdded(p.id);
                        setTimeout(() => setAdded((cur) => (cur === p.id ? null : cur)), 1200);
                      }}
                      className="mt-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
                    >
                      {added === p.id ? "Added ✓" : "Add to cart"}
                    </button>
                  </div>
                </article>
              );
            })}
      </div>

      {!loading && products.length === 0 && !error && (
        <p className="rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          No products yet — run <code className="font-mono text-xs">npx tsx scripts/seed.ts</code> to
          populate the catalog.
        </p>
      )}
    </div>
  );
}

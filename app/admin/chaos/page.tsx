"use client";

import { useEffect, useState } from "react";
import { client, getSessionId } from "@/lib/client";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface BugCard {
  id: string;
  description: string;
  run: (product: Product | undefined) => Promise<string>;
}

export default function ChaosPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    client.queries.getCatalog({}).then((res) => {
      const items = (res.data as { items?: Product[] } | null)?.items ?? [];
      setProducts(items);
    });
  }, []);

  const product = products[0];

  function report(bugId: string, message: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${bugId}: ${message}`, ...prev].slice(0, 20));
  }

  const bugs: BugCard[] = [
    {
      id: "#1 Oversell",
      description: "Fires 2 concurrent checkouts for ALL remaining stock of one product.",
      run: async (p) => {
        if (!p) return "No product loaded yet.";
        const args = {
          sessionId: getSessionId(),
          items: [{ productId: p.id, quantity: p.stock }],
        };
        const [a, b] = await Promise.all([
          client.mutations.checkout(args),
          client.mutations.checkout(args),
        ]);
        const okCount = [a, b].filter((r) => !r.errors?.length).length;
        return `${okCount}/2 concurrent checkouts for all ${p.stock} unit(s) of "${p.name}" succeeded.`;
      },
    },
    {
      id: "#2 Duplicate order",
      description: "Same idempotency key, sent twice at once — no dedupe check server-side.",
      run: async (p) => {
        if (!p) return "No product loaded yet.";
        const idempotencyKey = crypto.randomUUID();
        const args = { sessionId: getSessionId(), items: [{ productId: p.id, quantity: 1 }], idempotencyKey };
        const [a, b] = await Promise.all([client.mutations.checkout(args), client.mutations.checkout(args)]);
        const okCount = [a, b].filter((r) => !r.errors?.length).length;
        return `${okCount}/2 requests with the SAME idempotency key succeeded (both = duplicate order).`;
      },
    },
    {
      id: "#3 IAM AccessDenied",
      description: "Any normal checkout hits this — the Lambda role has no s3:PutObject on the audit bucket.",
      run: async (p) => {
        if (!p) return "No product loaded yet.";
        await client.mutations.checkout({ sessionId: getSessionId(), items: [{ productId: p.id, quantity: 1 }] });
        return "Checkout ran — check CloudWatch Logs for the AccessDenied on s3:PutObject.";
      },
    },
    {
      id: "#5 Coupon math",
      description: "Stacks SAVE10 + FLAT5 — result depends on application order (undefined behavior).",
      run: async (p) => {
        if (!p) return "No product loaded yet.";
        const res = await client.mutations.checkout({
          sessionId: getSessionId(),
          items: [{ productId: p.id, quantity: 3 }],
          couponCode: "SAVE10,FLAT5",
        });
        return `Total returned: ${JSON.stringify(res.data)}`;
      },
    },
    {
      id: "#7 Invalid input",
      description: "Checks out a product id that doesn't exist — unhandled exception (500).",
      run: async () => {
        const res = await client.mutations.checkout({
          sessionId: getSessionId(),
          items: [{ productId: "does-not-exist", quantity: 1 }],
        });
        return res.errors?.length ? `Failed as expected: ${res.errors[0].message}` : "Unexpectedly succeeded.";
      },
    },
    {
      id: "#8 Shipping timeout",
      description: "Forces the shipping-estimate call to take 8s against a 6s Lambda timeout.",
      run: async (p) => {
        if (!p) return "No product loaded yet.";
        const res = await client.mutations.checkout({
          sessionId: getSessionId(),
          items: [{ productId: p.id, quantity: 1 }],
          simulateSlowShipping: true,
        });
        return res.errors?.length ? `Timed out as expected: ${res.errors[0].message}` : "Unexpectedly succeeded.";
      },
    },
    {
      id: "#9 Expired token",
      description: "Simulates a stale Cognito session mid-checkout.",
      run: async (p) => {
        if (!p) return "No product loaded yet.";
        const res = await client.mutations.checkout({
          sessionId: getSessionId(),
          items: [{ productId: p.id, quantity: 1 }],
          simulateExpiredToken: true,
        });
        return res.errors?.length ? `Unauthorized as expected: ${res.errors[0].message}` : "Unexpectedly succeeded.";
      },
    },
    {
      id: "#10 N+1 catalog",
      description: "Reloads the catalog — one Scan + one GetItem PER product for ratings.",
      run: async () => {
        const res = await client.queries.getCatalog({});
        const count = (res.data as { items?: unknown[] } | null)?.items?.length ?? 0;
        return `Reloaded ${count} products — check CloudWatch for ${count} separate rating GetItem calls.`;
      },
    },
  ];

  async function trigger(bug: BugCard) {
    setBusyId(bug.id);
    try {
      const message = await bug.run(product);
      report(bug.id, message);
    } catch (err) {
      report(bug.id, `threw: ${String(err)}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">⚡ Chaos Panel</h1>
      <p className="mb-6 text-sm text-slate-500">
        One click per bug — each fires the real Lambda, so CloudWatch → SNS → SQS →
        log-forwarder → Cowork Local runs exactly like it would from organic traffic. Bug #4
        (lost cart update) and Bug #6 (rounding drift) aren&apos;t single actions — see{" "}
        <code>docs/BUGS.md</code> for their repro steps.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {bugs.map((bug) => (
          <div key={bug.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-red-600">{bug.id}</h2>
            <p className="mb-3 text-sm text-slate-500">{bug.description}</p>
            <button
              disabled={busyId === bug.id}
              onClick={() => trigger(bug)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              {busyId === bug.id ? "Triggering…" : "Trigger"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-2 font-semibold">Activity log</h2>
        <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-200">
          {log.length === 0 ? (
            <p className="text-slate-500">Nothing triggered yet.</p>
          ) : (
            log.map((line, i) => <p key={i}>{line}</p>)
          )}
        </div>
      </div>
    </div>
  );
}

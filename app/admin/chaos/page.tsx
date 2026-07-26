"use client";

import { useState, useSyncExternalStore } from "react";
import { scenarios } from "@/lib/chaos-scenarios";
import { getServerState, getState, requestRun, subscribe } from "@/lib/chaos-store";

type Outcome = { text: string; ok: boolean; at: string };

export default function ChaosPanel() {
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  const [headlessBusy, setHeadlessBusy] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});

  const running = state.runningId;

  async function runHeadless(id: string) {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario?.headless) return;
    setHeadlessBusy(id);
    try {
      const text = await scenario.headless();
      setOutcomes((p) => ({ ...p, [id]: { text, ok: true, at: new Date().toLocaleTimeString() } }));
    } catch (err) {
      setOutcomes((p) => ({
        ...p,
        [id]: { text: String(err), ok: false, at: new Date().toLocaleTimeString() },
      }));
    } finally {
      setHeadlessBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-danger/25 bg-gradient-to-br from-danger-soft to-surface p-8 sm:p-10">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-danger">
          <span aria-hidden>⚡</span> Chaos panel
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ten bugs, on demand</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          <strong className="text-fg">Run in UI</strong> hands the browser to an autopilot: it walks
          the real storefront, clicks the real buttons and types into the real inputs until the bug
          happens in front of you.{" "}
          <strong className="text-fg">Trigger</strong> skips the screen and calls the Lambda
          directly — faster, but there is nothing to watch.
        </p>
        {running && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2 text-sm font-medium shadow-card">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            Autopilot is driving — watch the panel in the corner.
          </p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((s) => {
          const isRunning = running === s.id;
          const outcome = outcomes[s.id];
          const verdict = state.verdict?.id === s.id ? state.verdict : null;
          return (
            <article
              key={s.id}
              className={`flex flex-col rounded-2xl border bg-surface p-5 shadow-card transition ${
                isRunning ? "border-accent shadow-card-md" : "border-line"
              }`}
            >
              <div className="mb-2 flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-danger-soft text-xs font-bold text-danger">
                  {s.num}
                </span>
                <h2 className="pt-0.5 font-semibold leading-tight">{s.title}</h2>
              </div>

              <p className="mb-3 text-sm leading-relaxed text-muted">{s.what}</p>

              <p className="mb-4 rounded-xl bg-elevated px-3.5 py-2.5 text-xs leading-relaxed text-muted">
                <span className="font-semibold text-fg">On screen: </span>
                {s.onScreen}
              </p>

              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  onClick={() => requestRun(s.id)}
                  disabled={!!running}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3.5 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-40"
                >
                  <span aria-hidden>▶</span>
                  {isRunning ? "Running…" : "Run in UI"}
                </button>
                {s.headless && (
                  <button
                    onClick={() => void runHeadless(s.id)}
                    disabled={!!running || headlessBusy === s.id}
                    className="rounded-xl border border-line px-3.5 py-2.5 text-sm font-medium text-muted transition hover:border-line-strong hover:text-fg disabled:opacity-40"
                  >
                    {headlessBusy === s.id ? "…" : "Trigger"}
                  </button>
                )}
              </div>

              {(verdict || outcome) && (
                <p
                  className={`rise mt-3 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    (verdict ? verdict.ok : outcome!.ok)
                      ? "bg-success-soft text-success"
                      : "bg-danger-soft text-danger"
                  }`}
                >
                  {verdict ? verdict.text : outcome!.text}
                </p>
              )}
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-2 text-sm font-semibold">How a failure reaches Cowork Local</h2>
        <p className="text-xs leading-relaxed text-muted">
          The Lambda logs the error → a CloudWatch Logs subscription filter matches the line and
          ships the event itself → the <code className="font-mono">log-forwarder</code> Lambda posts
          it to the Bugs Hunter webhook. Arrives within seconds, with the real message and stack
          trace, one delivery per occurrence.
        </p>
      </section>
    </div>
  );
}

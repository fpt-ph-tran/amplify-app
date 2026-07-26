"use client";

import { useState, useSyncExternalStore } from "react";
import { restockCatalog } from "@/lib/client";
import { scenarios } from "@/lib/chaos-scenarios";
import { getServerState, getState, requestRun, subscribe } from "@/lib/chaos-store";
import { useT } from "@/lib/i18n";

type Outcome = { text: string; ok: boolean; at: string };

export default function ChaosPanel() {
  const t = useT();
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  const [headlessBusy, setHeadlessBusy] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [restocking, setRestocking] = useState(false);
  const [restockResult, setRestockResult] = useState<Outcome | null>(null);

  async function restock() {
    setRestocking(true);
    setRestockResult(null);
    try {
      const { restocked } = await restockCatalog();
      setRestockResult({
        text: t("chaos.restocked", { count: restocked }),
        ok: true,
        at: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setRestockResult({
        text: t("chaos.restockFailed", { error: String(err) }),
        ok: false,
        at: new Date().toLocaleTimeString(),
      });
    } finally {
      setRestocking(false);
    }
  }

  const running = state.runningId;

  async function runHeadless(id: string) {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario?.headless) return;
    setHeadlessBusy(id);
    try {
      const text = await scenario.headless(t);
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
          <span aria-hidden>⚡</span> {t("chaos.eyebrow")}
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("chaos.title")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          <strong className="text-fg">{t("chaos.intro.a")}</strong> {t("chaos.intro.b")}{" "}
          <strong className="text-fg">{t("chaos.intro.c")}</strong> {t("chaos.intro.d")}
        </p>
        {running && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2 text-sm font-medium shadow-card">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            {t("chaos.driving")}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button
            onClick={() => void restock()}
            disabled={restocking || !!running}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold shadow-card transition hover:border-line-strong disabled:opacity-50"
          >
            <span className={restocking ? "animate-spin" : ""} aria-hidden>
              ⟳
            </span>
            {restocking ? t("chaos.restocking") : t("chaos.restock")}
          </button>
          <p className="max-w-md text-xs leading-relaxed text-muted">{t("chaos.restockHint")}</p>
        </div>

        {restockResult && (
          <p
            className={`rise mt-3 inline-block rounded-xl px-3.5 py-2 text-xs font-medium ${
              restockResult.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
            }`}
          >
            {restockResult.text}
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
                <h2 className="pt-0.5 font-semibold leading-tight">{t(s.titleKey)}</h2>
              </div>

              <p className="mb-3 text-sm leading-relaxed text-muted">{t(s.whatKey)}</p>

              <p className="mb-4 rounded-xl bg-elevated px-3.5 py-2.5 text-xs leading-relaxed text-muted">
                <span className="font-semibold text-fg">{t("chaos.onScreen")} </span>
                {t(s.screenKey)}
              </p>

              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  onClick={() => requestRun(s.id)}
                  disabled={!!running}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3.5 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-40"
                >
                  <span aria-hidden>▶</span>
                  {isRunning ? t("chaos.running") : t("chaos.runInUI")}
                </button>
                {s.headless && (
                  <button
                    onClick={() => void runHeadless(s.id)}
                    disabled={!!running || headlessBusy === s.id}
                    className="rounded-xl border border-line px-3.5 py-2.5 text-sm font-medium text-muted transition hover:border-line-strong hover:text-fg disabled:opacity-40"
                  >
                    {headlessBusy === s.id ? "…" : t("chaos.trigger")}
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
        <h2 className="mb-2 text-sm font-semibold">{t("chaos.pipeline.title")}</h2>
        <p className="text-xs leading-relaxed text-muted">
          {t("chaos.pipeline.body")}
        </p>
      </section>
    </div>
  );
}

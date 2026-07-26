"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  beginRun,
  clearVerdict,
  consumeCancel,
  endRun,
  getServerState,
  getState,
  onRunRequest,
  pushLog,
  requestCancel,
  resetCancel,
  setStep,
  subscribe,
} from "@/lib/chaos-store";
import { scenarioById, type ChaosApi } from "@/lib/chaos-scenarios";
import { useT } from "@/lib/i18n";

class Cancelled extends Error {}

/**
 * Lives in the root layout, so a run keeps going while the router moves between
 * the catalog, the cart and checkout. It drives the pages the way a person
 * would: scroll the control into view, highlight it, click it, type into it.
 */
export default function ChaosAutopilot() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  const pathnameRef = useRef(pathname);
  const runningRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const buildApi = useCallback((): ChaosApi => {
    const throwIfCancelled = () => {
      if (consumeCancel()) throw new Cancelled();
    };
    const pause = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const highlight = async (el: HTMLElement) => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("chaos-target");
      await pause(520);
      return () => el.classList.remove("chaos-target");
    };

    const waitFor = async (selector: string, timeoutMs = 12000): Promise<HTMLElement> => {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        throwIfCancelled();
        const el = document.querySelector<HTMLElement>(selector);
        if (el) return el;
        if (Date.now() > deadline) throw new Error(`Timed out waiting for ${selector}`);
        await pause(120);
      }
    };

    const waitForNth = async (selector: string, index: number, timeoutMs = 12000) => {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        throwIfCancelled();
        const all = document.querySelectorAll<HTMLElement>(selector);
        if (all[index]) return all[index];
        if (Date.now() > deadline) throw new Error(`Timed out waiting for ${selector}[${index}]`);
        await pause(120);
      }
    };

    const clickEl = async (el: HTMLElement, label: string) => {
      if (label) setStep(getState().stepNumber + 1, label);
      const unhighlight = await highlight(el);
      throwIfCancelled();
      el.click();
      if (label) pushLog("step", label);
      await pause(260);
      unhighlight();
      await pause(180);
    };

    const api: ChaosApi = {
      throwIfCancelled,
      pause,
      waitFor,
      exists: (selector) => !!document.querySelector(selector),

      step(label) {
        setStep(getState().stepNumber + 1, label);
        pushLog("step", label);
      },

      log(tone, text) {
        pushLog(tone, text);
      },

      async goto(path, label) {
        const target = label ?? t("step.goto", { path });
        setStep(getState().stepNumber + 1, target);
        pushLog("step", target);
        router.push(path);
        const deadline = Date.now() + 10000;
        // Wait for the route to actually swap before touching the new DOM.
        while (pathnameRef.current !== path.split("?")[0] && Date.now() < deadline) {
          throwIfCancelled();
          await pause(100);
        }
        await pause(500);
      },

      async click(selector, label) {
        const el = await waitFor(selector);
        await clickEl(el, label);
      },

      async clickNth(selector, index, label) {
        const el = await waitForNth(selector, index);
        await clickEl(el, label);
      },

      async doubleClick(selector, label) {
        const el = await waitFor(selector);
        setStep(getState().stepNumber + 1, label);
        const unhighlight = await highlight(el);
        throwIfCancelled();
        // No await between them: this is the impatient customer, and nothing
        // in the page disables the button after the first press.
        el.click();
        el.click();
        pushLog("step", `${label} (2 clicks, no gap)`);
        await pause(300);
        unhighlight();
      },

      async fill(selector, value, label) {
        const el = (await waitFor(selector)) as HTMLInputElement;
        setStep(getState().stepNumber + 1, label);
        const unhighlight = await highlight(el);
        throwIfCancelled();
        el.focus();
        // React tracks the input's value internally; go through the native
        // setter so its onChange actually fires.
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(proto.prototype, "value")?.set;
        setter?.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        pushLog("step", `${label} → "${value}"`);
        await pause(420);
        unhighlight();
        await pause(150);
      },

      async read(selector, attr) {
        const el = await waitFor(selector);
        if (attr === "value" && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
          return el.value;
        }
        return el.getAttribute(attr);
      },

      async readAll(selector, attr) {
        await waitFor(selector);
        return [...document.querySelectorAll(selector)].map((el) => el.getAttribute(attr));
      },

      openPeerTab(path) {
        return window.open(path, "_blank", "width=520,height=760");
      },

      t,
    };
    return api;
  }, [router, t]);

  useEffect(() => {
    return onRunRequest(async (scenarioId) => {
      if (runningRef.current) return;
      const scenario = scenarioById(scenarioId);
      if (!scenario) return;

      runningRef.current = true;
      resetCancel();
      setCollapsed(false);
      beginRun(scenario.id, scenario.steps);
      pushLog("info", t("hud.driving", { num: scenario.num, title: t(scenario.titleKey) }));

      try {
        const result = await scenario.run(buildApi());
        pushLog(result.ok ? "ok" : "warn", result.text);
        endRun({ id: scenario.id, ok: result.ok, text: result.text });
      } catch (err) {
        if (err instanceof Cancelled) {
          pushLog("warn", t("hud.stopped"));
          endRun(null);
        } else {
          const text = err instanceof Error ? err.message : String(err);
          pushLog("err", text);
          endRun({ id: scenario.id, ok: false, text });
        }
      } finally {
        document
          .querySelectorAll(".chaos-target")
          .forEach((el) => el.classList.remove("chaos-target"));
        resetCancel();
        runningRef.current = false;
      }
    });
  }, [buildApi, t]);

  const running = state.runningId !== null;
  if (!running && !state.verdict) return null;

  const toneClass: Record<string, string> = {
    info: "text-muted",
    step: "text-fg",
    ok: "text-success",
    warn: "text-warning",
    err: "text-danger",
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:justify-end sm:p-6">
      <div
        className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-card-lg backdrop-blur-xl"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {running && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                running ? "bg-accent" : state.verdict?.ok ? "bg-success" : "bg-danger"
              }`}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {running ? t("hud.title") : t("hud.finished")}
            </p>
            <p className="truncate text-xs text-muted">
              {running
                ? (state.currentStep ?? t("hud.starting"))
                : (state.verdict?.text ?? "")}
            </p>
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-elevated hover:text-fg"
          >
            {collapsed ? t("hud.show") : t("hud.hide")}
          </button>
          {running ? (
            <button
              onClick={requestCancel}
              className="rounded-lg bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger hover:opacity-80"
            >
              {t("hud.stop")}
            </button>
          ) : (
            <button
              onClick={clearVerdict}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-muted hover:bg-elevated hover:text-fg"
            >
              {t("hud.close")}
            </button>
          )}
        </div>

        {running && (
          <div className="h-0.5 w-full bg-elevated">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{
                width: `${Math.min(100, (state.stepNumber / Math.max(state.totalSteps, 1)) * 100)}%`,
              }}
            />
          </div>
        )}

        {!collapsed && (
          <div className="max-h-56 overflow-y-auto px-4 py-3">
            <ol className="space-y-1.5 font-mono text-[11px] leading-relaxed">
              {state.log.map((line, i) => (
                <li key={i} className={`flex gap-2 ${toneClass[line.tone] ?? "text-muted"}`}>
                  <span className="shrink-0 text-faint">
                    {new Date(line.at).toLocaleTimeString([], {
                      hour12: false,
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className="min-w-0 break-words">{line.text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

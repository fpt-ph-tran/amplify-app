"use client";

/**
 * Shared state between the Chaos Panel (which starts a run) and the autopilot
 * HUD (which lives in the root layout and actually drives the pages). They sit
 * on opposite sides of a route boundary, so a module-level store is what lets
 * a run survive `router.push` into the storefront.
 */

export type LogTone = "info" | "ok" | "warn" | "err" | "step";

export interface LogLine {
  at: number;
  tone: LogTone;
  text: string;
}

export interface ChaosState {
  /** Scenario currently being driven, or null when idle. */
  runningId: string | null;
  /** Human-readable label of the step in flight. */
  currentStep: string | null;
  stepNumber: number;
  totalSteps: number;
  log: LogLine[];
  /** Set when a run finishes, so the panel can show a verdict. */
  verdict: { id: string; ok: boolean; text: string } | null;
}

const initial: ChaosState = {
  runningId: null,
  currentStep: null,
  stepNumber: 0,
  totalSteps: 0,
  log: [],
  verdict: null,
};

let state: ChaosState = initial;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): ChaosState {
  return state;
}

/** Server snapshot for useSyncExternalStore — the HUD renders nothing on the server. */
export function getServerState(): ChaosState {
  return initial;
}

function set(patch: Partial<ChaosState>) {
  state = { ...state, ...patch };
  emit();
}

export function pushLog(tone: LogTone, text: string) {
  set({ log: [...state.log, { at: Date.now(), tone, text }].slice(-200) });
}

export function beginRun(id: string, totalSteps: number) {
  state = { ...initial, runningId: id, totalSteps };
  emit();
}

export function setStep(stepNumber: number, label: string) {
  set({ stepNumber, currentStep: label });
}

export function endRun(verdict: { id: string; ok: boolean; text: string } | null) {
  set({ runningId: null, currentStep: null, verdict });
}

export function clearVerdict() {
  set({ verdict: null });
}

/** Cooperative cancellation — the runner checks this between steps. */
let cancelled = false;
export function requestCancel() {
  cancelled = true;
}
export function consumeCancel(): boolean {
  return cancelled;
}
export function resetCancel() {
  cancelled = false;
}

/* -------------------------------------------------------------------------
   Start requests. The panel calls `requestRun`; the autopilot in the layout
   is the only thing that can actually execute one (it owns the router).
   ------------------------------------------------------------------------- */
type RunRequestListener = (scenarioId: string) => void;
const runRequestListeners = new Set<RunRequestListener>();

export function onRunRequest(listener: RunRequestListener): () => void {
  runRequestListeners.add(listener);
  return () => runRequestListeners.delete(listener);
}

export function requestRun(scenarioId: string) {
  for (const l of runRequestListeners) l(scenarioId);
}

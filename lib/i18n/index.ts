"use client";

import { useMemo, useSyncExternalStore } from "react";
import { en, type Dictionary, type TranslationKey } from "./en";
import { vi } from "./vi";
import { ja } from "./ja";

export type Lang = "en" | "vi" | "ja";
export const LANGS: Lang[] = ["en", "vi", "ja"];
export const STORAGE_KEY = "quickcart_lang";

const dictionaries: Record<Lang, Dictionary> = { en, vi, ja };

export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

export function translator(lang: Lang): Translate {
  const dict = dictionaries[lang] ?? en;
  return (key, params) => format(dict[key] ?? en[key] ?? key, params);
}

/* --- store ---------------------------------------------------------------
   Mirrors the theme: a plain observable so any component can read the current
   language without threading a provider through the tree. */
let current: Lang = "en";
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}
/** The server has no localStorage; render English and let hydration correct it. */
export function getServerLang(): Lang {
  return "en";
}

export function subscribeLang(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLang(next: Lang) {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode — the switch still works for this session */
  }
  document.documentElement.lang = next;
  for (const l of listeners) l();
}

/** Picks up whatever the bootstrap script already resolved. */
export function initLangFromDom() {
  const fromDom = document.documentElement.lang as Lang;
  if (LANGS.includes(fromDom) && fromDom !== current) {
    current = fromDom;
    for (const l of listeners) l();
  }
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, getServerLang);
}

export function useT(): Translate {
  const lang = useLang();
  // Rebuilt only when the language actually changes.
  return useMemo(() => translator(lang), [lang]);
}

export type { TranslationKey };

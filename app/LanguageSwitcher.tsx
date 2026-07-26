"use client";

import { useEffect, useRef, useState } from "react";
import { LANGS, initLangFromDom, setLang, useLang, useT, type Lang } from "@/lib/i18n";

const SHORT: Record<Lang, string> = { en: "EN", vi: "VI", ja: "JA" };

export default function LanguageSwitcher() {
  const lang = useLang();
  const t = useT();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // The bootstrap script resolved the language before React ran; adopt it.
  useEffect(() => initLangFromDom(), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("lang.switch")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-1 rounded-xl border border-line bg-surface px-2.5 text-xs font-semibold text-muted transition hover:border-line-strong hover:text-fg"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
        </svg>
        {SHORT[lang]}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-card-lg"
        >
          {LANGS.map((l) => (
            <li key={l}>
              <button
                role="option"
                aria-selected={l === lang}
                onClick={() => {
                  setLang(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-elevated ${
                  l === lang ? "font-semibold text-accent" : "text-fg"
                }`}
              >
                {t(`lang.name.${l}` as const)}
                {l === lang && <span aria-hidden>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

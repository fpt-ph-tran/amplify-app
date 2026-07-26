"use client";

import { useT } from "@/lib/i18n";

export default function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-line px-6 py-6">
      <p className="mx-auto max-w-6xl text-center text-xs text-faint">{t("footer.tagline")}</p>
    </footer>
  );
}

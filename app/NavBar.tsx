"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/client";
import { useT } from "@/lib/i18n";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

export default function NavBar() {
  const pathname = usePathname();
  const t = useT();
  const links = [
    { href: "/", label: t("nav.shop") },
    { href: "/cart", label: t("nav.cart") },
  ];
  const [count, setCount] = useState(0);

  useEffect(() => {
    const read = () => setCount(getCart().reduce((n, i) => n + Math.max(i.quantity, 0), 0));
    read();
    window.addEventListener("quickcart:cart-changed", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("quickcart:cart-changed", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-5 py-3 sm:gap-2 sm:px-6">
        <Link href="/" className="mr-2 flex items-center gap-2 font-semibold tracking-tight sm:mr-4">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-base text-accent-fg shadow-card">
            ⚡
          </span>
          <span className="text-[15px]">QuickCart</span>
        </Link>

        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active ? "bg-elevated text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {l.label}
              {l.href === "/cart" && count > 0 && (
                <span className="ml-1.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-fg">
                  {count}
                </span>
              )}
            </Link>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/admin/chaos"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              pathname === "/admin/chaos"
                ? "bg-danger text-white"
                : "border border-line bg-surface text-muted hover:border-danger hover:text-danger"
            }`}
          >
            <span aria-hidden>⚡</span>
            <span className="hidden sm:inline">{t("nav.chaos")}</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

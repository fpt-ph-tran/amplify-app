import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ConfigureAmplify from "./ConfigureAmplify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuickCart",
  description: "A demo storefront that ships its own production bugs to Cowork Local.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <ConfigureAmplify />
        <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-orange-600">
              🛒 QuickCart
            </Link>
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Catalog
            </Link>
            <Link href="/cart" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Cart
            </Link>
            <Link
              href="/admin/chaos"
              className="ml-auto text-sm font-medium text-slate-500 hover:text-red-600"
            >
              ⚡ Chaos Panel
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          QuickCart demo — errors here are shipped to Cowork Local via CloudWatch → SNS → SQS.
        </footer>
      </body>
    </html>
  );
}

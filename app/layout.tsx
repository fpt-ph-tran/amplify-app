import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConfigureAmplify from "./ConfigureAmplify";
import NavBar from "./NavBar";
import ChaosAutopilot from "./ChaosAutopilot";
import Footer from "./Footer";
import { THEME_BOOTSTRAP } from "@/lib/theme-script";

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
    // The bootstrap script sets data-theme and lang before React hydrates, so
    // the server-rendered html element deliberately won't match.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ConfigureAmplify />
        <NavBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-6 sm:py-10">{children}</main>
        <Footer />
        {/* Sits outside <main> so a run survives navigation between pages. */}
        <ChaosAutopilot />
      </body>
    </html>
  );
}

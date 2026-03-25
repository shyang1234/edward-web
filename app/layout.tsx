import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteBackground } from "@/components/SiteBackground";
import { Sidebar } from "@/components/Sidebar";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "個人筆記",
  description: "讀書心得、給女兒的建議、成長歷程與財務追蹤",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <SiteBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          <SiteHeader />
          <main className="mx-auto w-full max-w-[min(100%,118rem)] flex-1 px-4 py-10 sm:px-6">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
              <div className="min-w-0 w-full max-w-screen-2xl flex-1 rounded-3xl border border-white/40 bg-white/55 p-6 shadow-2xl shadow-stone-900/10 backdrop-blur-md sm:p-8 lg:p-10">
                {children}
              </div>
              <Sidebar />
            </div>
          </main>
          <footer className="relative z-10 border-t border-white/20 bg-stone-950/30 py-8 text-center text-sm text-stone-100 backdrop-blur-sm">
            <p>本地撰寫 · GitHub · Vercel</p>
            <p className="mt-1 text-xs text-stone-300/90">
              背景為高山草原意象；可改為自攝合歡山照片（見 README）
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

import Link from "next/link";
import { IconMountain } from "@/components/svg-icons";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-white/25 bg-white/25 backdrop-blur-md">
      <div className="mx-auto flex max-w-[min(100%,118rem)] items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900 drop-shadow-sm"
        >
          <IconMountain
            className="h-6 w-6 text-emerald-700"
            strokeWidth={2}
            aria-hidden
          />
          個人筆記
        </Link>
        <nav className="flex gap-4 text-sm font-medium text-stone-800">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 transition hover:bg-white/50 hover:text-emerald-900"
          >
            首頁
          </Link>
        </nav>
      </div>
    </header>
  );
}

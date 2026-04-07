"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function VisitorCounter() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);

    fetch("/api/visits", { method: "POST" })
      .then((r) => r.json())
      .then((d: { count?: number | null; error?: string }) => {
        if (cancelled) return;
        if (typeof d.count === "number") {
          setCount(d.count);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="rounded-2xl border border-white/50 bg-white/55 p-5 shadow-lg shadow-stone-900/5 backdrop-blur-md">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-stone-500">
        累計拜訪人數
      </h2>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-stone-900">
        {error ? (
          <span className="text-base font-normal text-stone-500">
            無法載入（Vercel 請依 README 連結 Upstash Redis）
          </span>
        ) : count === null ? (
          <span className="text-base font-normal text-stone-400">載入中…</span>
        ) : (
          count.toLocaleString("zh-Hant")
        )}
      </p>
    </div>
  );
}

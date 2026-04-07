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
          <span className="text-base font-normal text-stone-700">
            無法載入。請在 Vercel → Settings → Environment Variables 確認已連結
            Redis，且 Production 有
            <code className="mx-0.5 rounded bg-stone-200/80 px-1 text-stone-900">
              UPSTASH_REDIS_REST_*
            </code>
            或
            <code className="mx-0.5 rounded bg-stone-200/80 px-1 text-stone-900">
              KV_REST_API_*
            </code>
            後再 Redeploy。
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

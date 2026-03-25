import Link from "next/link";
import { CATEGORIES, CATEGORY_SLUGS } from "@/lib/categories";
import { getLatestPosts } from "@/lib/posts";

const LATEST_COUNT = 10;

export function Sidebar() {
  const latest = getLatestPosts(LATEST_COUNT);

  return (
    <aside className="w-full shrink-0 space-y-8 lg:sticky lg:top-24 lg:w-72">
      <nav className="rounded-2xl border border-white/50 bg-white/55 p-5 shadow-lg shadow-stone-900/5 backdrop-blur-md">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-stone-500">
          分類
        </h2>
        <ul className="mt-3 space-y-2">
          {CATEGORY_SLUGS.map((slug) => {
            const c = CATEGORIES[slug];
            return (
              <li key={slug}>
                <Link
                  href={`/${slug}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-stone-800 transition hover:bg-emerald-50 hover:text-emerald-900"
                >
                  <span className="text-base" aria-hidden>
                    {c.emoji}
                  </span>
                  <span>{c.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rounded-2xl border border-white/50 bg-white/55 p-5 shadow-lg shadow-stone-900/5 backdrop-blur-md">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-stone-500">
          最新 {LATEST_COUNT} 篇
        </h2>
        {latest.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">尚無已發布文章。</p>
        ) : (
          <ol className="mt-3 list-none space-y-3 p-0">
            {latest.map((p, i) => (
              <li key={`${p.category}-${p.slug}`}>
                <Link
                  href={`/${p.category}/${p.slug}`}
                  className="group block rounded-lg px-1 py-0.5 hover:bg-stone-100/80"
                >
                  <span className="text-xs text-stone-400">
                    {i + 1}.{" "}
                    <span className="text-stone-500">
                      {CATEGORIES[p.category].title}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm font-medium leading-snug text-stone-800 group-hover:text-emerald-900">
                    {p.title}
                  </span>
                  <span className="text-xs text-stone-400">{p.date}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}

import Link from "next/link";
import { CategoryHomeIcon } from "@/components/CategoryHomeIcon";
import { categoryCardStyle } from "@/lib/categoryVisuals";
import type { CategorySlug } from "@/lib/categories";

type Props = {
  href: string;
  title: string;
  description: string;
  categorySlug: CategorySlug;
};

export function CategoryCard({
  href,
  title,
  description,
  categorySlug,
}: Props) {
  const style = categoryCardStyle[categorySlug];

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-2xl border border-white/50 bg-gradient-to-br ${style.gradient} p-6 shadow-lg shadow-stone-900/10 ring-2 ${style.ring} backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-stone-900/15`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-lg ${style.iconWrap}`}
        >
          <CategoryHomeIcon
            slug={categorySlug}
            className="h-8 w-8 drop-shadow-sm"
          />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="font-display text-xl font-semibold text-stone-900 group-hover:text-emerald-900">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700/90">
            {description}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800/90">
            進入分類
            <span
              className="transition group-hover:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

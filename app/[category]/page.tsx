import Link from "next/link";
import { notFound } from "next/navigation";
import { PostListIcon } from "@/components/PostListIcon";
import { CategoryHomeIcon } from "@/components/CategoryHomeIcon";
import { CATEGORIES, isCategorySlug } from "@/lib/categories";
import type { CategorySlug } from "@/lib/categories";
import { categoryCardStyle } from "@/lib/categoryVisuals";
import { getAllPostsByCategory } from "@/lib/posts";

type Props = { params: Promise<{ category: string }> };

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategorySlug(category)) notFound();

  const meta = CATEGORIES[category];
  const byCat = getAllPostsByCategory();
  const posts = byCat[category];
  const cat = category as CategorySlug;
  const hero = categoryCardStyle[cat];

  return (
    <div>
      <p className="text-sm text-stone-600">
        <Link href="/" className="font-medium text-emerald-800 hover:underline">
          首頁
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span>{meta.title}</span>
      </p>

      <div
        className={`mt-4 flex flex-col gap-4 rounded-2xl border border-white/50 bg-gradient-to-br ${hero.gradient} p-6 ring-2 ${hero.ring} sm:flex-row sm:items-center`}
      >
        <span
          className={`flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-2xl shadow-lg sm:self-center ${hero.iconWrap}`}
        >
          <CategoryHomeIcon slug={cat} className="h-10 w-10" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold text-stone-900">
            {meta.title}
          </h1>
          <p className="mt-2 text-stone-800/90">{meta.description}</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-stone-100/60 p-8 text-center text-stone-600">
          尚無文章。請在{" "}
          <code className="rounded bg-stone-200 px-1.5 py-0.5 text-sm">
            content/{category}/你的檔名.md
          </code>{" "}
          新增 Markdown。
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {posts.map((p, index) => (
            <li key={p.slug}>
              <Link
                href={`/${category}/${p.slug}`}
                className="group flex gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-md shadow-stone-900/5 ring-1 ring-stone-200/60 backdrop-blur-sm transition hover:-translate-y-px hover:border-emerald-200/80 hover:shadow-lg hover:shadow-emerald-900/10"
              >
                <PostListIcon category={cat} index={index} />
                <div className="min-w-0 flex-1 py-0.5">
                  <span className="font-semibold text-stone-900 group-hover:text-emerald-900">
                    {p.title}
                  </span>
                  <span className="ml-2 text-sm text-stone-500">{p.date}</span>
                  {p.description && (
                    <p className="mt-1 text-sm text-stone-600">
                      {p.description}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

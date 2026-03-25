import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBody } from "@/components/MarkdownBody";
import { CategoryHomeIcon } from "@/components/CategoryHomeIcon";
import { CATEGORIES, isCategorySlug } from "@/lib/categories";
import type { CategorySlug } from "@/lib/categories";
import { categoryCardStyle } from "@/lib/categoryVisuals";
import { getPost } from "@/lib/posts";

type Props = { params: Promise<{ category: string; slug: string }> };

export default async function PostPage({ params }: Props) {
  const { category, slug } = await params;
  if (!isCategorySlug(category)) notFound();

  const post = getPost(category, slug);
  if (!post) notFound();

  const catMeta = CATEGORIES[category];
  const cat = category as CategorySlug;
  const hero = categoryCardStyle[cat];

  return (
    <article>
      <p className="text-sm text-stone-600">
        <Link href="/" className="font-medium text-emerald-800 hover:underline">
          首頁
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <Link
          href={`/${category}`}
          className="font-medium text-emerald-800 hover:underline"
        >
          {catMeta.title}
        </Link>
      </p>

      <div
        className={`mt-6 flex flex-col gap-4 rounded-2xl border border-white/50 bg-gradient-to-br ${hero.gradient} p-6 ring-2 ${hero.ring} sm:flex-row sm:items-start`}
      >
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-lg ${hero.iconWrap}`}
        >
          <CategoryHomeIcon slug={cat} className="h-8 w-8" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-2 text-sm text-stone-600">{post.date}</p>
          {post.description && (
            <p className="mt-3 text-lg text-stone-800">{post.description}</p>
          )}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-stone-200/80 bg-white/50 p-6 sm:p-8">
        <MarkdownBody content={post.content} />
      </div>
    </article>
  );
}

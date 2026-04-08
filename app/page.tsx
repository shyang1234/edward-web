import { CategoryCard } from "@/components/CategoryCard";
import { IconSparkles } from "@/components/svg-icons";
import { CATEGORIES, CATEGORY_SLUGS } from "@/lib/categories";

export default function HomePage() {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <IconSparkles
          className="h-7 w-7 text-amber-500"
          strokeWidth={1.75}
          aria-hidden
        />
        <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          歡迎
        </h1>
      </div>
      <p className="mt-3 text-stone-700">依分類瀏覽文章與筆記。</p>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2">
        {CATEGORY_SLUGS.map((slug) => {
          const c = CATEGORIES[slug];
          return (
            <li key={slug}>
              <CategoryCard
                href={`/${slug}`}
                title={c.title}
                description={c.description}
                categorySlug={slug}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
      <p className="mt-3 text-stone-700">
        依分類整理文章；在{" "}
        <code className="rounded-lg bg-stone-200/80 px-2 py-0.5 text-sm text-stone-800">
          content/
        </code>{" "}
        新增 Markdown 即可。
      </p>

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

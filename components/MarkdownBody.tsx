import ReactMarkdown from "react-markdown";
import type { CategorySlug } from "@/lib/categories";

type Props = {
  content: string;
  /** 用於把 `./media/...` 轉成 `/content/<category>/...`（Next 只提供 public/） */
  category: CategorySlug;
};

function resolveMarkdownAssetSrc(
  src: string | undefined,
  category: CategorySlug,
): string | undefined {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return src;
  const trimmed = src.replace(/^\.\//, "");
  return `/content/${category}/${trimmed}`;
}

export function MarkdownBody({ content, category }: Props) {
  return (
    <article className="prose prose-stone prose-lg max-w-none prose-headings:font-display prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-li:marker:text-stone-800 [&_img:first-of-type]:!mx-auto [&_img:first-of-type]:!block [&_img:first-of-type]:!w-1/2 [&_img:first-of-type]:!max-w-[50%] [&_img:first-of-type]:!max-h-[42.5vh] [&_img:first-of-type]:!object-contain">
      <ReactMarkdown
        components={{
          img: ({ src, alt, ...rest }) => (
            <img
              {...rest}
              src={resolveMarkdownAssetSrc(src, category)}
              alt={alt ?? ""}
              className="mx-auto block max-h-[85vh] w-auto max-w-full object-contain"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

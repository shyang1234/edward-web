import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { CategorySlug } from "./categories";
import { CATEGORY_SLUGS, isCategorySlug } from "./categories";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description?: string;
  draft?: boolean;
};

export type Post = PostMeta & {
  category: CategorySlug;
  content: string;
};

export type PostMetaWithCategory = PostMeta & { category: CategorySlug };

/** 全站依日期排序，取最近 N 篇（供側欄等使用） */
export function getLatestPosts(limit: number): PostMetaWithCategory[] {
  const byCat = getAllPostsByCategory();
  const all: PostMetaWithCategory[] = [];
  for (const cat of CATEGORY_SLUGS) {
    for (const p of byCat[cat]) {
      all.push({ ...p, category: cat });
    }
  }
  return all
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

function readPostsInCategory(category: CategorySlug): PostMeta[] {
  const dir = path.join(CONTENT_DIR, category);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const posts: PostMeta[] = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data } = matter(raw);
    const title = typeof data.title === "string" ? data.title : slug;
    const date =
      typeof data.date === "string" ? data.date : "1970-01-01";
    const description =
      typeof data.description === "string" ? data.description : undefined;
    const draft = data.draft === true;

    posts.push({ slug, title, date, description, draft });
  }

  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllPostsByCategory(): Record<CategorySlug, PostMeta[]> {
  const out = {} as Record<CategorySlug, PostMeta[]>;
  for (const cat of CATEGORY_SLUGS) {
    out[cat] = readPostsInCategory(cat);
  }
  return out;
}

export function getPost(category: string, slug: string): Post | null {
  if (!isCategorySlug(category)) return null;
  const filePath = path.join(CONTENT_DIR, category, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const title = typeof data.title === "string" ? data.title : slug;
  const date = typeof data.date === "string" ? data.date : "1970-01-01";
  const description =
    typeof data.description === "string" ? data.description : undefined;
  if (data.draft === true) return null;

  return {
    category,
    slug,
    title,
    date,
    description,
    content,
  };
}

export function getAllSlugs(): { category: CategorySlug; slug: string }[] {
  const pairs: { category: CategorySlug; slug: string }[] = [];
  for (const cat of CATEGORY_SLUGS) {
    const dir = path.join(CONTENT_DIR, cat);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      pairs.push({ category: cat, slug: file.replace(/\.md$/, "") });
    }
  }
  return pairs;
}

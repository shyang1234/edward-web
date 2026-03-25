/**
 * 分類 slug → 中文標題與說明（之後若要改名稱只改這裡）
 */
export const CATEGORIES = {
  reading: {
    title: "讀書心得",
    description: "閱讀筆記與摘要",
    emoji: "📚",
  },
  "advice-daughter": {
    title: "給女兒的建議",
    description: "想說的話與提醒",
    emoji: "💌",
  },
  growth: {
    title: "成長歷程",
    description: "紀錄與反思",
    emoji: "🌱",
  },
  finance: {
    title: "財務追蹤",
    description: "經濟指標、個股與理財筆記（持續擴充）",
    emoji: "📈",
  },
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

export const CATEGORY_SLUGS = Object.keys(CATEGORIES) as CategorySlug[];

export function isCategorySlug(s: string): s is CategorySlug {
  return s in CATEGORIES;
}

import type { CategorySlug } from "./categories";

/** 首頁分類卡片的漸層與邊框色 */
export const categoryCardStyle: Record<
  CategorySlug,
  {
    gradient: string;
    iconWrap: string;
    ring: string;
  }
> = {
  reading: {
    gradient: "from-amber-100/90 via-orange-50/80 to-amber-50/70",
    iconWrap: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/30",
    ring: "ring-amber-200/60",
  },
  "advice-daughter": {
    gradient: "from-rose-100/90 via-pink-50/80 to-rose-50/70",
    iconWrap: "bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-rose-500/30",
    ring: "ring-rose-200/60",
  },
  growth: {
    gradient: "from-emerald-100/90 via-lime-50/80 to-green-50/70",
    iconWrap: "bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-emerald-500/30",
    ring: "ring-emerald-200/60",
  },
  finance: {
    gradient: "from-slate-100/90 via-emerald-50/85 to-amber-50/75",
    iconWrap: "bg-gradient-to-br from-emerald-600 to-amber-500 text-white shadow-emerald-600/35",
    ring: "ring-emerald-300/50",
  },
};

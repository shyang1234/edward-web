import type { ComponentType } from "react";
import {
  IconBookOpen,
  IconBookMarked,
  IconLibrary,
  IconBookCopy,
  IconLineChart,
  IconTrendingUp,
  IconCoins,
  IconWallet,
  IconHeart,
  IconMail,
  IconGift,
  IconSparklesSmall,
  IconSprout,
  IconTreePine,
  IconLeaf,
  IconFlower2,
} from "@/components/svg-icons";
import type { CategorySlug } from "@/lib/categories";

type IconComp = ComponentType<{
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}>;

const reading: IconComp[] = [
  IconBookOpen,
  IconBookMarked,
  IconLibrary,
  IconBookCopy,
];
const finance: IconComp[] = [
  IconLineChart,
  IconTrendingUp,
  IconCoins,
  IconWallet,
];
const advice: IconComp[] = [IconHeart, IconMail, IconGift, IconSparklesSmall];
const growth: IconComp[] = [IconSprout, IconTreePine, IconLeaf, IconFlower2];

const byCategory: Record<CategorySlug, IconComp[]> = {
  reading,
  finance,
  "advice-daughter": advice,
  growth,
};

const wrapStyle: Record<CategorySlug, string> = {
  reading: "bg-amber-100/90 text-amber-800 ring-amber-200/80",
  finance: "bg-emerald-100/90 text-emerald-800 ring-emerald-200/80",
  "advice-daughter": "bg-rose-100/90 text-rose-800 ring-rose-200/80",
  growth: "bg-lime-100/90 text-lime-900 ring-lime-200/80",
};

type Props = {
  category: CategorySlug;
  index: number;
};

export function PostListIcon({ category, index }: Props) {
  const icons = byCategory[category];
  const Icon = icons[index % icons.length];
  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-2 ring-inset backdrop-blur-sm ${wrapStyle[category]}`}
    >
      <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
    </span>
  );
}

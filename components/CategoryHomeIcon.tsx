import {
  IconBookOpen,
  IconHeart,
  IconSprout,
  IconLineChart,
} from "@/components/svg-icons";
import type { CategorySlug } from "@/lib/categories";

const map = {
  reading: IconBookOpen,
  "advice-daughter": IconHeart,
  growth: IconSprout,
  finance: IconLineChart,
} as const;

type Props = {
  slug: CategorySlug;
  className?: string;
};

export function CategoryHomeIcon({ slug, className }: Props) {
  const Icon = map[slug];
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}

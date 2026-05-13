export type IndicatorGroup = "leading" | "coincident" | "lagging";
export type IndicatorKind = "price" | "fred" | "simulated_tw";
export type IndicatorVolatility = "high" | "low";

export type IndicatorMeta = {
  id: string;
  label: string;
  group: IndicatorGroup;
  kind: IndicatorKind;
  volatility: IndicatorVolatility;
  fredId?: string;
  transform?: "yoy12";
  normalize?: boolean;
};

export const ECONOMIC_INDICATORS: IndicatorMeta[] = [
  {
    id: "tw_m1b_yoy",
    label: "台灣 M1b 年增率（模擬）",
    group: "leading",
    kind: "simulated_tw",
    volatility: "low",
    transform: "yoy12",
  },
  {
    id: "tw_m2_yoy",
    label: "台灣 M2 年增率（模擬）",
    group: "leading",
    kind: "simulated_tw",
    volatility: "low",
    transform: "yoy12",
  },
  {
    id: "us_m1_yoy",
    label: "美國 M1 年增率（FRED M1SL）",
    group: "leading",
    kind: "fred",
    volatility: "low",
    fredId: "M1SL",
    transform: "yoy12",
  },
  {
    id: "us_m2_yoy",
    label: "美國 M2 年增率（FRED M2SL）",
    group: "leading",
    kind: "fred",
    volatility: "low",
    fredId: "M2SL",
    transform: "yoy12",
  },
  {
    id: "twii",
    label: "加權指數 (^TWII)",
    group: "leading",
    kind: "price",
    volatility: "high",
  },
  {
    id: "gspc",
    label: "S&P 500 (^GSPC)",
    group: "leading",
    kind: "price",
    volatility: "high",
  },
  {
    id: "payems",
    label: "美國非農就業（指數化）",
    group: "coincident",
    kind: "fred",
    volatility: "high",
    fredId: "PAYEMS",
    normalize: true,
  },
  {
    id: "indpro",
    label: "美國工業生產（指數化）",
    group: "coincident",
    kind: "fred",
    volatility: "high",
    fredId: "INDPRO",
    normalize: true,
  },
  {
    id: "fed_funds",
    label: "美國聯邦基金利率（FRED FEDFUNDS）",
    group: "lagging",
    kind: "fred",
    volatility: "low",
    fredId: "FEDFUNDS",
  },
  {
    id: "tw_cpi_yoy",
    label: "台灣 CPI 年增率（FRED TWNPCPIPCPPPT）",
    group: "lagging",
    kind: "fred",
    volatility: "low",
    fredId: "TWNPCPIPCPPPT",
  },
  {
    id: "cpi",
    label: "美國 CPI 年增率（FRED CPIAUCSL）",
    group: "lagging",
    kind: "fred",
    volatility: "low",
    fredId: "CPIAUCSL",
    transform: "yoy12",
  },
  {
    id: "real_rate_10y",
    label: "美國 10Y 實質利率（FRED DFII10）",
    group: "leading",
    kind: "fred",
    volatility: "low",
    fredId: "DFII10",
  },
];

export const INDICATOR_MAP = new Map(
  ECONOMIC_INDICATORS.map((item) => [item.id, item]),
);

export function getIndicatorsByGroup(group: IndicatorGroup): IndicatorMeta[] {
  return ECONOMIC_INDICATORS.filter((item) => item.group === group);
}

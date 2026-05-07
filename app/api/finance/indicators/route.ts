import { NextRequest, NextResponse } from "next/server";
import {
  ECONOMIC_INDICATORS,
  INDICATOR_MAP,
  type IndicatorMeta,
} from "@/lib/economic-indicators";

type Point = { date: string; value: number | null };

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseDate(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return fallback;
  return date;
}

function transformSeries(values: Point[], transform?: "yoy12"): Point[] {
  if (transform !== "yoy12") return values;
  return values.map((point, index) => {
    const prev = values[index - 12]?.value ?? null;
    if (point.value === null || prev === null || prev === 0) {
      return { ...point, value: null };
    }
    return {
      ...point,
      value: ((point.value / prev) - 1) * 100,
    };
  });
}

function normalizeSeries(values: Point[]): Point[] {
  const base = values.find((point) => point.value !== null)?.value;
  if (base === undefined || base === null || base === 0) return values;
  return values.map((point) => ({
    ...point,
    value: point.value === null ? null : (point.value / base) * 100,
  }));
}

function listMonthlyDates(start: Date, end: Date): string[] {
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const out: string[] = [];
  while (cursor <= end) {
    out.push(toIsoDate(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

function simulateTaiwanSeries(
  id: "tw_m1b_yoy" | "tw_m2_yoy",
  dates: string[],
): Point[] {
  const base = id === "tw_m1b_yoy" ? 18000 : 42000;
  const growth = id === "tw_m1b_yoy" ? 0.002 : 0.003;
  const wave = id === "tw_m1b_yoy" ? 0.015 : 0.013;

  const raw = dates.map((date, index) => {
    const cyc = Math.sin(index / 6) * wave;
    const level = base * Math.exp(index * growth + cyc);
    return { date, value: level };
  });
  return transformSeries(raw, "yoy12");
}

async function fetchYahooSeries(
  symbol: "^TWII" | "^GSPC",
  start: Date,
  end: Date,
): Promise<Point[]> {
  const period1 = Math.floor(start.getTime() / 1000);
  const period2 = Math.floor(end.getTime() / 1000) + 86400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  };

  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const points: Point[] = [];

  for (let i = 0; i < timestamps.length; i += 1) {
    const ts = timestamps[i];
    const close = closes[i] ?? null;
    if (!ts) continue;
    points.push({
      date: toIsoDate(new Date(ts * 1000)),
      value: close,
    });
  }
  return points;
}

async function fetchFredSeries(
  indicator: IndicatorMeta,
  start: Date,
  end: Date,
  apiKey: string | undefined,
): Promise<Point[]> {
  if (!indicator.fredId || !apiKey) return [];
  const params = new URLSearchParams({
    series_id: indicator.fredId,
    api_key: apiKey,
    file_type: "json",
    observation_start: toIsoDate(start),
    observation_end: toIsoDate(end),
  });

  const url = `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];

  const payload = (await response.json()) as {
    observations?: Array<{ date?: string; value?: string }>;
  };

  const raw: Point[] =
    payload.observations?.map((row) => {
      const num =
        row.value && row.value !== "." && !Number.isNaN(Number(row.value))
          ? Number(row.value)
          : null;
      return {
        date: row.date ?? "",
        value: num,
      };
    }) ?? [];

  return transformSeries(raw, indicator.transform);
}

function alignAndFill(calendar: string[], raw: Point[]): Point[] {
  const map = new Map(raw.map((point) => [point.date, point.value]));
  let prev: number | null = null;
  return calendar.map((date) => {
    const current = map.has(date) ? (map.get(date) ?? null) : null;
    if (current !== null) prev = current;
    return { date, value: current ?? prev };
  });
}

export async function GET(request: NextRequest) {
  const now = new Date();
  const defaultStart = new Date(Date.UTC(now.getUTCFullYear() - 10, 0, 1));
  const search = request.nextUrl.searchParams;

  const start = parseDate(search.get("start"), defaultStart);
  const end = parseDate(search.get("end"), now);
  if (start > end) {
    return NextResponse.json(
      { error: "start 不可晚於 end" },
      { status: 400 },
    );
  }

  const idsParam = search.get("ids");
  const ids = (idsParam ? idsParam.split(",") : ECONOMIC_INDICATORS.map((i) => i.id))
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => INDICATOR_MAP.has(value));
  if (ids.length === 0) {
    return NextResponse.json({ error: "至少選擇一個有效指標" }, { status: 400 });
  }

  const fredApiKey = process.env.FRED_API_KEY;
  const warnings: string[] = [];
  if (!fredApiKey) {
    warnings.push("尚未設定 FRED_API_KEY，FRED 指標可能無資料。");
  }

  const monthlyCalendar = listMonthlyDates(start, end);
  const responseSeries = await Promise.all(
    ids.map(async (id) => {
      const indicator = INDICATOR_MAP.get(id);
      if (!indicator) return null;

      let raw: Point[] = [];
      if (indicator.kind === "price") {
        raw = await fetchYahooSeries(id === "twii" ? "^TWII" : "^GSPC", start, end);
      } else if (indicator.kind === "fred") {
        raw = await fetchFredSeries(indicator, start, end, fredApiKey);
      } else if (indicator.kind === "simulated_tw") {
        raw = simulateTaiwanSeries(id as "tw_m1b_yoy" | "tw_m2_yoy", monthlyCalendar);
      }

      let values = alignAndFill(monthlyCalendar, raw);
      if (indicator.normalize) values = normalizeSeries(values);

      return {
        id,
        label: indicator.label,
        group: indicator.group,
        volatility: indicator.volatility,
        values,
      };
    }),
  );

  return NextResponse.json({
    start: toIsoDate(start),
    end: toIsoDate(end),
    warnings,
    series: responseSeries.filter(Boolean),
  });
}

"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ECONOMIC_INDICATORS,
  getIndicatorsByGroup,
  type IndicatorGroup,
} from "@/lib/economic-indicators";

type ApiSeries = {
  id: string;
  label: string;
  group: IndicatorGroup;
  volatility: "high" | "low";
  values: Array<{ date: string; value: number | null }>;
};

type ApiResponse = {
  warnings: string[];
  series: ApiSeries[];
};

const COLORS = [
  "#047857",
  "#B45309",
  "#1D4ED8",
  "#9333EA",
  "#EA580C",
  "#0F766E",
  "#BE123C",
  "#334155",
];

const PRESET_SELECTIONS: Array<{ key: string; label: string; ids: string[] }> = [
  {
    key: "quick",
    label: "景氣快篩",
    ids: ["twii", "gspc", "us_m2_yoy", "fed_funds", "cpi"],
  },
  {
    key: "liquidity",
    label: "流動性觀察",
    ids: ["tw_m1b_yoy", "tw_m2_yoy", "us_m1_yoy", "us_m2_yoy", "real_rate_10y"],
  },
  {
    key: "industry-jobs",
    label: "景氣活動追蹤",
    ids: ["payems", "indpro", "gspc", "twii"],
  },
];

function formatDateInput(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function defaultStartDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 10);
  date.setMonth(0);
  date.setDate(1);
  return formatDateInput(date);
}

function buildPolylinePoints(
  series: ApiSeries,
  domain: { minX: number; maxX: number; minY: number; maxY: number },
  size: { width: number; height: number; left: number; top: number },
): string {
  const points = series.values
    .filter((item) => item.value !== null)
    .map((item) => {
      const x = new Date(`${item.date}T00:00:00`).getTime();
      const y = item.value as number;
      const px =
        size.left +
        ((x - domain.minX) / Math.max(1, domain.maxX - domain.minX)) * size.width;
      const py =
        size.top +
        (1 - (y - domain.minY) / Math.max(1e-6, domain.maxY - domain.minY)) *
          size.height;
      return `${px.toFixed(2)},${py.toFixed(2)}`;
    });
  return points.join(" ");
}

function formatNumber(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "--";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function buildMarkdownReport(input: {
  title: string;
  start: string;
  end: string;
  series: ApiSeries[];
}): string {
  const { title, start, end, series } = input;
  const dateSet = new Set<string>();
  for (const item of series) {
    for (const point of item.values) dateSet.add(point.date);
  }
  const dates = Array.from(dateSet).sort();
  const latestDate = dates[dates.length - 1] ?? "";

  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`- 區間：${start} ~ ${end}`);
  lines.push(`- 指標數：${series.length}`);
  lines.push(`- 最新資料月份：${latestDate || "N/A"}`);
  lines.push("");
  lines.push("## 最新值摘要");
  lines.push("");
  lines.push("| 指標 | 最新值 |");
  lines.push("|---|---:|");
  for (const item of series) {
    const latest = item.values.findLast((point) => point.value !== null)?.value ?? null;
    lines.push(`| ${item.label} | ${formatNumber(latest)} |`);
  }
  lines.push("");
  lines.push("## 原始序列");
  lines.push("");
  lines.push(`| date | ${series.map((item) => item.label).join(" | ")} |`);
  lines.push(`|---|${series.map(() => "---:").join("|")}|`);

  const bySeries = series.map((item) => new Map(item.values.map((point) => [point.date, point.value])));
  for (const date of dates) {
    const values = bySeries.map((map) => formatNumber(map.get(date) ?? null));
    lines.push(`| ${date} | ${values.join(" | ")} |`);
  }
  lines.push("");
  return lines.join("\n");
}

export function EconomicIndicatorDashboard() {
  const [start, setStart] = useState(defaultStartDate);
  const [end, setEnd] = useState(formatDateInput(new Date()));
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ECONOMIC_INDICATORS.map((item) => [item.id, false])),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [series, setSeries] = useState<ApiSeries[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string>("");

  const grouped = useMemo(
    () => ({
      leading: getIndicatorsByGroup("leading"),
      coincident: getIndicatorsByGroup("coincident"),
      lagging: getIndicatorsByGroup("lagging"),
    }),
    [],
  );

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, checked]) => checked)
        .map(([id]) => id),
    [selected],
  );

  const leftAndRightSeries = useMemo(() => {
    const left: ApiSeries[] = [];
    const right: ApiSeries[] = [];
    const active = series;
    if (active.length === 2) {
      left.push(active[0]);
      right.push(active[1]);
      return { left, right };
    }
    if (active.length >= 3) {
      for (const item of active) {
        if (item.volatility === "low") right.push(item);
        else left.push(item);
      }
      if (left.length === 0 && right.length > 0) left.push(right.shift() as ApiSeries);
      if (right.length === 0 && left.length > 1) right.push(left.pop() as ApiSeries);
      return { left, right };
    }
    left.push(...active);
    return { left, right };
  }, [series]);

  const chart = useMemo(() => {
    const width = 960;
    const height = 460;
    const plot = { left: 66, top: 24, width: 820, height: 360 };
    const allDates = series
      .flatMap((item) => item.values.map((value) => new Date(`${value.date}T00:00:00`).getTime()))
      .filter((value) => Number.isFinite(value));
    if (allDates.length === 0) return null;

    const domainX = {
      min: Math.min(...allDates),
      max: Math.max(...allDates),
    };

    const yRange = (items: ApiSeries[]) => {
      const values = items.flatMap((item) =>
        item.values
          .map((point) => point.value)
          .filter((point): point is number => point !== null),
      );
      if (values.length === 0) return { min: 0, max: 1 };
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (min === max) return { min: min - 1, max: max + 1 };
      const pad = (max - min) * 0.08;
      return { min: min - pad, max: max + pad };
    };

    const leftRange = yRange(leftAndRightSeries.left);
    const rightRange = yRange(leftAndRightSeries.right);
    const legend: Array<{ name: string; color: string; axis: "left" | "right" }> = [];

    const dates = series[0]?.values.map((item) => item.date) ?? [];
    const polylines = series.map((item, index) => {
      const color = COLORS[index % COLORS.length];
      const axis = leftAndRightSeries.right.some((x) => x.id === item.id) ? "right" : "left";
      const yDomain = axis === "right" ? rightRange : leftRange;
      legend.push({ name: item.label, color, axis });
      const points = buildPolylinePoints(
        item,
        {
          minX: domainX.min,
          maxX: domainX.max,
          minY: yDomain.min,
          maxY: yDomain.max,
        },
        plot,
      );
      return { points, color, axis };
    });

    return {
      width,
      height,
      plot,
      leftRange,
      rightRange,
      polylines,
      legend,
      domainX,
      dates,
    };
  }, [leftAndRightSeries.left, leftAndRightSeries.right, series]);

  async function loadData(overrideIds?: string[]) {
    const ids = overrideIds ?? selectedIds;
    if (ids.length === 0) {
      setError("請先勾選至少一個指標。");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start,
        end,
        ids: ids.join(","),
      });
      const response = await fetch(`/api/finance/indicators?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("資料讀取失敗，請稍後再試。");
      }
      const payload = (await response.json()) as ApiResponse;
      setSeries(payload.series);
      setWarnings(payload.warnings ?? []);
      setHoverIndex(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "讀取失敗";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(ids: string[]) {
    const next = Object.fromEntries(
      ECONOMIC_INDICATORS.map((item) => [item.id, ids.includes(item.id)]),
    );
    setSelected(next);
    void loadData(ids);
  }

  function downloadMarkdown(markdown: string, filename: string) {
    const blob = new Blob([`\uFEFF${markdown}`], {
      type: "text/markdown;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function exportMarkdown() {
    if (series.length === 0) {
      setError("目前沒有可匯出的資料，請先載入趨勢圖。");
      return;
    }
    const markdown = buildMarkdownReport({
      title: "經濟指標趨勢報告",
      start,
      end,
      series,
    });
    downloadMarkdown(markdown, `economic-indicators-${start}-to-${end}.md`);
  }

  async function analyzeWithGoogleAi() {
    if (series.length === 0) {
      setError("請先載入指標資料，再送 Google AI 分析。");
      return;
    }
    setError(null);
    setAnalysisLoading(true);
    try {
      const markdown = buildMarkdownReport({
        title: "經濟指標趨勢報告（AI 分析版）",
        start,
        end,
        series,
      });
      const response = await fetch("/api/finance/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      const payload = (await response.json()) as
        | { analysis: string; model: string }
        | {
            error: string;
            code?: number;
            status?: string;
            message?: string;
            tips?: string[];
            detail?: string;
          };
      if (!response.ok || !("analysis" in payload)) {
        if ("error" in payload) {
          const extras: string[] = [];
          if (payload.code) extras.push(`code=${payload.code}`);
          if (payload.status) extras.push(`status=${payload.status}`);
          if (payload.message) extras.push(`訊息：${payload.message}`);
          if (payload.tips?.length) extras.push(`建議：${payload.tips.join("；")}`);
          const extraText = extras.length ? ` (${extras.join(" | ")})` : "";
          throw new Error(`${payload.error}${extraText}`);
        }
        throw new Error(
          "Google AI 分析失敗，請稍後再試。",
        );
      }
      setAnalysisText(payload.analysis);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google AI 分析失敗";
      setError(message);
    } finally {
      setAnalysisLoading(false);
    }
  }

  const hoverData = useMemo(() => {
    if (!chart || hoverIndex === null) return null;
    const idx = Math.max(0, Math.min(hoverIndex, chart.dates.length - 1));
    const date = chart.dates[idx];
    if (!date) return null;

    const x =
      chart.plot.left +
      (idx / Math.max(1, chart.dates.length - 1)) * chart.plot.width;

    const points = chart.legend.map((legendItem, legendIndex) => {
      const src = series[legendIndex];
      return {
        ...legendItem,
        value: src?.values[idx]?.value ?? null,
      };
    });
    return { idx, date, x, points };
  }, [chart, hoverIndex, series]);

  return (
    <section className="mt-8 space-y-6 rounded-2xl border border-stone-200 bg-white/75 p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-2xl font-semibold text-stone-900">
        經濟指標趨勢
      </h2>
      <p className="text-sm text-stone-600">
        可同時勾選領先、同時、落後指標；選兩項時左右軸各放一條，選三項以上時「波動較大」優先放左軸。
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-stone-700">預設組合：</span>
        {PRESET_SELECTIONS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => applyPreset(preset.ids)}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        <label className="text-sm text-stone-700">
          起始日期
          <input
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm text-stone-700">
          結束日期
          <input
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="mt-6 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {loading ? "載入中..." : "更新趨勢圖"}
        </button>
        <button
          type="button"
          onClick={exportMarkdown}
          disabled={series.length === 0}
          className="mt-6 rounded-lg bg-stone-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          匯出 Markdown
        </button>
        <button
          type="button"
          onClick={() => void analyzeWithGoogleAi()}
          disabled={series.length === 0 || analysisLoading}
          className="mt-6 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {analysisLoading ? "Google AI 分析中..." : "送 Google AI 分析"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {(["leading", "coincident", "lagging"] as const).map((group) => (
          <div key={group} className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="mb-2 text-base font-semibold text-stone-900">
              {group === "leading"
                ? "領先指標"
                : group === "coincident"
                  ? "同時指標"
                  : "落後指標"}
            </h3>
            <div className="space-y-2">
              {grouped[group].map((item) => (
                <label key={item.id} className="flex items-start gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={selected[item.id] ?? false}
                    onChange={(event) =>
                      setSelected((prev) => ({ ...prev, [item.id]: event.target.checked }))
                    }
                    className="mt-1"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {warnings.map((warning) => (
        <p key={warning} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {warning}
        </p>
      ))}

      {!chart ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-12 text-center text-stone-500">
          勾選指標後，按「更新趨勢圖」即可顯示資料。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white p-3">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="min-w-[860px]"
            role="img"
            aria-label="經濟指標趨勢圖"
            onMouseMove={(event) => {
              if (!chart) return;
              const rect = event.currentTarget.getBoundingClientRect();
              if (rect.width <= 0) return;
              const x = ((event.clientX - rect.left) / rect.width) * chart.width;
              if (x < chart.plot.left || x > chart.plot.left + chart.plot.width) {
                setHoverIndex(null);
                return;
              }
              const ratio = (x - chart.plot.left) / chart.plot.width;
              const idx = Math.round(ratio * Math.max(0, chart.dates.length - 1));
              setHoverIndex(idx);
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <rect
              x={chart.plot.left}
              y={chart.plot.top}
              width={chart.plot.width}
              height={chart.plot.height}
              fill="#FAFAF9"
              stroke="#D6D3D1"
            />

            <text x={12} y={24} fontSize="12" fill="#292524">
              左軸：股指/高波動
            </text>
            <text x={840} y={24} fontSize="12" fill="#292524">
              右軸：利率/年增率
            </text>

            {chart.polylines.map((line, index) => (
              <polyline
                key={`${line.color}-${index}`}
                points={line.points}
                fill="none"
                stroke={line.color}
                strokeWidth="2"
              />
            ))}

            {hoverData && (
              <line
                x1={hoverData.x}
                x2={hoverData.x}
                y1={chart.plot.top}
                y2={chart.plot.top + chart.plot.height}
                stroke="#64748B"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
            )}

            <text x={22} y={chart.plot.top + 8} fontSize="11" fill="#57534E">
              {chart.leftRange.max.toFixed(2)}
            </text>
            <text x={22} y={chart.plot.top + chart.plot.height} fontSize="11" fill="#57534E">
              {chart.leftRange.min.toFixed(2)}
            </text>
            <text x={900} y={chart.plot.top + 8} fontSize="11" fill="#57534E">
              {chart.rightRange.max.toFixed(2)}
            </text>
            <text x={900} y={chart.plot.top + chart.plot.height} fontSize="11" fill="#57534E">
              {chart.rightRange.min.toFixed(2)}
            </text>
          </svg>

          {hoverData && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-800">{hoverData.date}</p>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {hoverData.points.map((point) => (
                  <div key={point.name} className="flex items-center gap-2 text-slate-700">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: point.color }}
                    />
                    <span className="truncate">{point.name}</span>
                    <span className="ml-auto font-medium text-slate-900">
                      {formatNumber(point.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {chart.legend.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs text-stone-700">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
                <span className="text-stone-500">({item.axis === "left" ? "左軸" : "右軸"})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysisText && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-indigo-900">Google AI 分析結果</h3>
          <div className="prose prose-stone mt-3 max-w-none prose-p:my-2 prose-li:my-1">
            <ReactMarkdown>{analysisText}</ReactMarkdown>
          </div>
        </div>
      )}
    </section>
  );
}

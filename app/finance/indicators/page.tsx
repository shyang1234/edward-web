import Link from "next/link";
import { EconomicIndicatorDashboard } from "@/components/EconomicIndicatorDashboard";

export const metadata = {
  title: "經濟指標趨勢 | 木哥的書房筆記",
  description: "領先、同時、落後指標的趨勢觀察儀表板",
};

export default function FinanceIndicatorsPage() {
  return (
    <div>
      <p className="text-sm text-stone-600">
        <Link href="/" className="font-medium text-emerald-800 hover:underline">
          首頁
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <Link href="/finance" className="font-medium text-emerald-800 hover:underline">
          財務追蹤
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span>經濟指標趨勢</span>
      </p>

      <div className="mt-4 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-amber-50 p-6">
        <h1 className="font-display text-3xl font-semibold text-stone-900">
          經濟指標趨勢選擇
        </h1>
        <p className="mt-2 text-stone-700">
          這裡整合你原本 Python/Streamlit 的核心流程：日期區間、領先/同時/落後指標勾選、同圖比較趨勢。
        </p>
      </div>

      <EconomicIndicatorDashboard />
    </div>
  );
}

"""
台美股指與總經指標 — Streamlit + Plotly
資料：yfinance、FRED 官方 JSON API、FinMind／模擬（僅台灣 M1b）；pandas_datareader 僅作 FRED 備援。
"""

from __future__ import annotations

import os
from datetime import date, timedelta
from typing import Any

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import requests
import streamlit as st
import yfinance as yf
from plotly.subplots import make_subplots

try:
    import pandas_datareader.data as web
except ImportError:
    web = None  # type: ignore


FINMIND_DATA_URL = "https://api.finmindtrade.com/api/v4/data"

# 指標 metadata：分類、左/右軸、資料來源與顯示方式
SERIES_META: dict[str, dict[str, Any]] = {
    # --- 領先 ---
    "tw_m1b_yoy": {
        "label": "台灣 M1b 年增率（%；FinMind／模擬）",
        "group": "leading",
        "kind": "taiwan_macro",
        "field": "m1b",
        "fred_transform": "yoy12", # 即使是模擬數據也應用此轉換
        "normalize": False,
        "volatility": "low",
    },
    "tw_m2_yoy": {
        "label": "台灣 M2 年增率（%；FinMind／模擬）",
        "group": "leading",
        "kind": "taiwan_macro",
        "field": "m2",
        "fred_transform": "yoy12", # 即使是模擬數據也應用此轉換
        "normalize": False,
        "volatility": "low",
    },
    "us_m1_yoy": {
        "label": "美國 M1 年增率（%；FRED M1SL，作為美國 M1／M1b 近似）",
        "group": "leading",
        "kind": "fred",
        "fred_id": "M1SL",
        "fred_transform": "yoy12",
        "normalize": False,
        "volatility": "low",
    },
    "us_m2_yoy": {
        "label": "美國 M2 年增率（%；FRED M2SL，較前一年同期）",
        "group": "leading",
        "kind": "fred",
        "fred_id": "M2SL",
        "fred_transform": "yoy12",
        "normalize": False,
        "volatility": "low",
    },
    "twii": {
        "label": "加權指數 (^TWII)",
        "group": "leading",
        "kind": "price",
        "volatility": "high",
    },
    "gspc": {
        "label": "S&P 500 (^GSPC)",
        "group": "leading",
        "kind": "price",
        "volatility": "high",
    },
    "supplier_delivery": {
        "label": "供應商交貨（費城聯準製造業：目前交貨時間擴散指數 SA，近似）",
        "group": "leading",
        "kind": "fred",
        "fred_id": "DTCDFSA066MSFRBPHI",
        "normalize": False,
        "volatility": "high",
    },
    # --- 同時 ---
    "payems": {
        "label": "美國非農就業人數（指數化，期初=100）",
        "group": "coincident",
        "kind": "fred",
        "fred_id": "PAYEMS",
        "normalize": True,
        "volatility": "high",
    },
    "indpro": {
        "label": "美國工業生產指數（指數化，期初=100）",
        "group": "coincident",
        "kind": "fred",
        "fred_id": "INDPRO",
        "normalize": True,
        "volatility": "high",
    },
    # --- 落後 ---
    "fed_funds": {
        "label": "美國 FED 有效聯邦基金利率 (%)（FRED: FEDFUNDS）",
        "group": "lagging",
        "kind": "fred",
        "fred_id": "FEDFUNDS",
        "normalize": False,
        "volatility": "low",
    },
    "tw_cpi_yoy": {
        "label": "台灣 CPI 年度百分比變化（FRED: TWNPCPIPCPPPT）",
        "group": "lagging",
        "kind": "fred",
        "fred_id": "TWNPCPIPCPPPT",
        "normalize": False,
        "volatility": "low",
    },
    "tw_central_bank_rate": { # 目前無 FRED 或 FinMind 數據
        "label": "台灣中央銀行利率（FRED／FinMind 暫無資料）",
        "group": "lagging",
        "kind": "fred", # 仍設定為 fred，未來若有數據可直接套用
        "fred_id": "NO_DATA_TW_RATE", # 暫時用一個不存在的 ID
        "normalize": False,
        "volatility": "low",
    },
    "cpi": {
        "label": "美國 CPI 年增率（較前一年同期，%）",
        "group": "lagging",
        "kind": "fred",
        "fred_id": "CPIAUCSL",
        "fred_transform": "yoy12",
        "normalize": False,
        "volatility": "low",
    },
    "real_rate_10y": {
        "label": "美國 10 年期抗通膨公債殖利率（實質利率近似）(%)",
        "group": "lagging",
        "kind": "fred",
        "fred_id": "DFII10",
        "normalize": False,
        "volatility": "low",
    },
}


def _secrets_token() -> str | None:
    try:
        t = st.secrets.get("FINMIND_TOKEN") if hasattr(st, "secrets") else None
        if t:
            return str(t)
    except Exception:
        pass
    env_t = os.getenv("FINMIND_TOKEN")
    return env_t if env_t else None


def _fred_api_key() -> str | None:
    return os.getenv("FRED_API_KEY")


def _fred_transform_series(s: pd.Series, transform: str | None) -> pd.Series:
    """FRED 原始序列的衍生計算（例如 CPI 年增率）。"""
    if s.empty or not transform:
        return s
    if transform == "yoy12":
        return ((s / s.shift(12)) - 1.0) * 100.0
    return s


def fred_cache_key_for_meta(meta: dict[str, Any]) -> str:
    fid = meta["fred_id"]
    tr = meta.get("fred_transform")
    return f"{fid}__{tr}" if tr else fid


def fetch_yfinance_indices(start: date, end: date) -> pd.DataFrame:
    """擷取 ^TWII、^GSPC 收盤價（分別下載，避免單邊失敗時欄位錯亂）。"""
    end_excl = end + timedelta(days=1)
    parts: list[pd.Series] = []

    def close_to_series(raw: pd.DataFrame) -> pd.Series | None:
        """yfinance 在單日、單 ticker、或多層欄位時 Close 可能是 Series / DataFrame / 純量。"""
        if raw.empty or "Close" not in raw.columns:
            return None
        c = raw["Close"]
        if isinstance(c, pd.DataFrame):
            if c.shape[1] != 1:
                return None
            c = c.iloc[:, 0]
        if isinstance(c, pd.Series):
            s = pd.Series(c.to_numpy(dtype=float), index=pd.to_datetime(c.index))
        else:
            try:
                v = float(c)
            except (TypeError, ValueError):
                return None
            idx = pd.to_datetime(raw.index)
            if len(idx) != 1:
                return None
            s = pd.Series([v], index=idx)
        s = s.dropna()
        if s.empty:
            return None
        idx = pd.DatetimeIndex(pd.to_datetime(s.index))
        if idx.tz is not None:
            idx = idx.tz_convert(None)
        s.index = idx
        return s

    def one(ticker: str, col: str) -> None:
        raw = yf.download(
            ticker,
            start=start.isoformat(),
            end=end_excl.isoformat(),
            auto_adjust=True,
            progress=False,
        )
        s = close_to_series(raw)
        if s is None:
            return
        parts.append(s.rename(col))

    one("^TWII", "twii")
    one("^GSPC", "gspc")
    if not parts:
        return pd.DataFrame()
    out = pd.concat(parts, axis=1, sort=True)
    return out.sort_index()


def fetch_fred_series(series_id: str, start: date, end: date) -> pd.Series:
    """
    擷取 FRED 序列。pandas_datareader 使用的 fredgraph.csv 端點已由官方停用／常回 500，
    因此改以官方 observations JSON API 為主（須設定 FRED_API_KEY）。
    """
    key = _fred_api_key()
    start_s = start.isoformat()
    end_s = end.isoformat()

    def _from_json_api() -> pd.Series | None:
        if not key:
            return None
        params = {
            "series_id": series_id,
            "api_key": key,
            "file_type": "json",
            "observation_start": start_s,
            "observation_end": end_s,
        }
        try:
            r = requests.get(
                "https://api.stlouisfed.org/fred/series/observations",
                params=params,
                timeout=60,
            )
            r.raise_for_status()
            js = r.json()
            obs = js.get("observations") or []
            if not obs:
                return pd.Series(dtype=float)
            rows = []
            for o in obs:
                d = o.get("date")
                v = o.get("value")
                if not d:
                    continue
                if v in (".", None, ""):
                    rows.append((pd.Timestamp(d), np.nan))
                else:
                    try:
                        rows.append((pd.Timestamp(d), float(v)))
                    except (TypeError, ValueError):
                        rows.append((pd.Timestamp(d), np.nan))
            if not rows:
                return pd.Series(dtype=float)
            idx, vals = zip(*rows)
            return pd.Series(vals, index=pd.DatetimeIndex(idx)).sort_index()
        except Exception:
            return None

    # 優先：官方 JSON API
    s_api = _from_json_api()
    if s_api is not None and not s_api.dropna().empty:
        return s_api

    # 備援：舊版 pandas_datareader（多數環境已不可用）
    if web is not None and key:
        os.environ["FRED_API_KEY"] = key
    try:
        if web is None:
            return pd.Series(dtype=float)
        end_adj = end + timedelta(days=1)
        df = web.DataReader(series_id, "fred", start, end_adj)
        if df.empty:
            return pd.Series(dtype=float)
        col = df.columns[0]
        out = df[col].copy()
        out.index = pd.to_datetime(out.index)
        return out.sort_index()
    except Exception:
        return pd.Series(dtype=float)


def _finmind_get(
    dataset: str,
    start: date,
    end: date,
    token: str | None,
    timeout: int = 45,
) -> list[dict[str, Any]] | None:
    params: dict[str, str] = {
        "dataset": dataset,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    }
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.get(FINMIND_DATA_URL, params=params, headers=headers, timeout=timeout)
        if r.status_code != 200:
            return None
        js = r.json()
        if js.get("status") != 200 or js.get("msg") != "success":
            return None
        data = js.get("data")
        return data if isinstance(data, list) else None
    except Exception:
        return None


def _rows_to_monthly_df(rows: list[dict[str, Any]]) -> pd.DataFrame | None:
    """將 FinMind 回傳列轉成月度索引 DataFrame（欄位名容錯）。"""
    if not rows:
        return None
    records = []
    for row in rows:
        d = row.get("date") or row.get("Date") or row.get("month")
        if not d:
            continue
        records.append(row)
    if not records:
        return None
    df = pd.DataFrame(records)
    date_col = "date" if "date" in df.columns else ("Date" if "Date" in df.columns else None)
    if date_col is None:
        return None
    df["_dt"] = pd.to_datetime(df[date_col])
    df = df.set_index("_dt").sort_index()
    return df


def try_finmind_taiwan_money_supply(
    start: date, end: date, token: str | None
) -> pd.DataFrame | None:
    """
    嘗試以 FinMind 抓取台灣貨幣供給；取回之 M1 欄位視為 M1b 近似序列，並尋找 M2。
    目前 FinMind TaiwanMoneySupply 不開放給免費或一般用戶，此函數暫時會失敗。
    """
    # 目前 FinMind TaiwanMoneySupply 不開放給免費或一般用戶，直接返回 None
    return None


def simulated_taiwan_m1b(start: date, end: date) -> pd.DataFrame:
    """可重現的模擬台灣 M1b（月度，十億新台幣級距）。"""
    rng = np.random.default_rng(42)
    monthly = pd.date_range(start=start, end=end, freq="MS")
    n = len(monthly)
    drift_m = np.cumsum(rng.normal(0.002, 0.015, size=n))
    base_m1b = 18000.0
    m1b = base_m1b * np.exp(drift_m)
    return pd.DataFrame({"m1b": m1b}, index=monthly)

def simulated_taiwan_m2(start: date, end: date) -> pd.DataFrame:
    """可重現的模擬台灣 M2（月度，十億新台幣級距）。"""
    rng = np.random.default_rng(43) # Use a different seed for M2
    monthly = pd.date_range(start=start, end=end, freq="MS")
    n = len(monthly)
    # M2 typically grows slightly faster than M1b
    drift_m = np.cumsum(rng.normal(0.003, 0.016, size=n))
    base_m2 = 40000.0
    m2 = base_m2 * np.exp(drift_m)
    return pd.DataFrame({"m2": m2}, index=monthly)

def load_taiwan_money_supply(
    start: date, end: date, prefer_finmind: bool, token: str | None
) -> tuple[pd.DataFrame, bool]:
    """回傳 (含 m1b, m2 欄位之 DataFrame, 是否為模擬)。"""
    money_sim = True
    df_m1b = pd.Series(dtype=float)
    df_m2 = pd.Series(dtype=float)

    # FinMind data retrieval attempt (currently not working for free users for TaiwanMoneySupply)
    if prefer_finmind:
        # 即使 FinMind 目前無法提供數據，保留調用結構以備未來擴展
        # 假設 FinMind 成功，會返回包含 "m1b" 和 "m2" 的 DataFrame
        finmind_df = try_finmind_taiwan_money_supply(start, end, token)
        if finmind_df is not None and not finmind_df.empty:
            if "m1b" in finmind_df.columns:
                df_m1b = finmind_df["m1b"]
            if "m2" in finmind_df.columns:
                df_m2 = finmind_df["m2"]
            if not df_m1b.empty or not df_m2.empty:
                money_sim = False
    
    # 如果 FinMind 失敗或未優先使用，則回退到模擬數據
    if df_m1b.empty:
        df_m1b = simulated_taiwan_m1b(start, end)["m1b"]
        money_sim = True # 只要有一項是模擬，就標記為模擬
    if df_m2.empty:
        df_m2 = simulated_taiwan_m2(start, end)["m2"]
        money_sim = True  # 只要有一項是模擬，就標記為模擬

    # 合併 M1b 和 M2 序列到一個 DataFrame
    # 這裡確保即使只有 M1b 或 M2 模擬成功，也能正確創建 DataFrame
    combined_df_data = {}
    if not df_m1b.empty:
        combined_df_data["m1b"] = df_m1b
    if not df_m2.empty:
        combined_df_data["m2"] = df_m2

    if not combined_df_data: # 如果都沒有數據，返回空 DataFrame
        return pd.DataFrame(), True

    wide = pd.DataFrame(combined_df_data).sort_index()
    return wide, money_sim


def align_to_calendar(idx: pd.DatetimeIndex, s: pd.Series) -> pd.Series:
    if s.empty:
        return pd.Series(index=idx, dtype=float)
    s = s.copy()
    s.index = pd.to_datetime(s.index)
    return s.reindex(idx).ffill()


def normalize_series_window(s: pd.Series, mask: pd.Series) -> pd.Series:
    """在 mask 為 True 的區間內，以該區間第一個非 NA 值為 100 做指數化。"""
    sub = s.loc[mask].dropna()
    if sub.empty:
        return pd.Series(index=s.index, dtype=float)
    base = sub.iloc[0]
    if base == 0 or pd.isna(base):
        return pd.Series(index=s.index, dtype=float)
    out = (s / base) * 100
    return out


@st.cache_data(ttl=1800, show_spinner=False)
def load_panel(
    start_s: str,
    end_s: str,
    prefer_finmind: bool,
    finmind_token_s: str | None,
) -> dict[str, Any]:
    start = date.fromisoformat(start_s)
    end = date.fromisoformat(end_s)
    token = finmind_token_s if finmind_token_s else None

    indices = fetch_yfinance_indices(start, end)
    idx = indices.index if not indices.empty else pd.date_range(start, end, freq="B")

    raw_ids = {m["fred_id"] for m in SERIES_META.values() if m.get("kind") == "fred"}
    raw_by_id = {fid: fetch_fred_series(fid, start, end) for fid in raw_ids}

    fred_cache: dict[str, pd.Series] = {}
    for m in SERIES_META.values():
        if m.get("kind") != "fred":
            continue
        ck = fred_cache_key_for_meta(m)
        if ck in fred_cache:
            continue
        raw = raw_by_id[m["fred_id"]]
        fred_cache[ck] = _fred_transform_series(raw, m.get("fred_transform"))

    tw_macro_raw_df, tw_money_sim = load_taiwan_money_supply(start, end, prefer_finmind, token)

    # 將台灣巨觀數據（M1b/M2 年增率）轉換後加入 fred_cache
    for sid, meta in SERIES_META.items():
        if meta.get("kind") == "taiwan_macro":
            field = meta["field"]
            # 確保欄位存在且數據非空才進行處理
            if field in tw_macro_raw_df.columns and not tw_macro_raw_df[field].empty:
                raw_series = tw_macro_raw_df[field]
                # 對原始數據應用 FRED 轉換，例如 yoy12
                transformed_series = _fred_transform_series(raw_series, meta.get("fred_transform"))
                # 使用 sid 作為 key 存入 fred_cache，以便 build_figure 統一處理
                fred_cache[sid] = transformed_series

    return {
        "indices": indices,
        "fred": fred_cache, # fred_cache 現在包含了美國 FRED 和台灣巨觀數據
        "tw_money_simulated": tw_money_sim,
        "calendar_index": idx,
    }


def resolve_secondary_y(sid: str, index: int, active_sids: list[str]) -> bool:
    """
    決定 traces 使用右軸（secondary_y=True）與否。
    - 恰選 2 個：依側邊欄排序第 1 條左、第 2 條右。
    - 選 3 個以上：起伏較大（volatility=high）→ 左；較小（%、年增）→ 右。
    - 若僅剩單一類別則該類全部擠在對應單軸（全 high→左，全 low→右）。
    """
    n = len(active_sids)
    if n <= 1:
        return False
    if n == 2:
        return index == 1
    highs = [s for s in active_sids if SERIES_META[s]["volatility"] == "high"]
    lows = [s for s in active_sids if SERIES_META[s]["volatility"] == "low"]
    if not lows:
        return False
    if not highs:
        return True
    return SERIES_META[sid]["volatility"] == "low"


def build_figure(
    panel: dict[str, Any],
    start: date,
    end: date,
    selected: dict[str, bool],
) -> go.Figure:
    indices: pd.DataFrame = panel["indices"]
    fred: dict[str, pd.Series] = panel["fred"]

    if indices.empty:
        cal = pd.date_range(pd.Timestamp(start), pd.Timestamp(end), freq="B")
    else:
        cal = indices.index

    mask = (cal >= pd.Timestamp(start)) & (cal <= pd.Timestamp(end))
    cal_win = cal[mask]

    fig = make_subplots(specs=[[{"secondary_y": True}]])

    active_sids = [sid for sid in SERIES_META if selected.get(sid)]
    n_sel = len(active_sids)

    def add_trace_line(y: pd.Series, label: str, secondary_y: bool, do_norm: bool) -> bool:
        if y.empty:
            return False
        aligned = align_to_calendar(cal_win, y).loc[cal_win]
        if do_norm:
            aligned = normalize_series_window(aligned, pd.Series(True, index=cal_win))
        fig.add_trace(
            go.Scatter(x=cal_win, y=aligned.values, name=label, mode="lines"),
            secondary_y=secondary_y,
        )
        return True

    any_trace = False

    for idx, sid in enumerate(active_sids):
        meta = SERIES_META[sid]
        sec_y = resolve_secondary_y(sid, idx, active_sids)
        kind = meta["kind"]

        if kind == "price":
            col = "twii" if sid == "twii" else "gspc"
            if indices.empty or col not in indices.columns:
                continue
            if add_trace_line(indices[col], meta["label"], sec_y, False):
                any_trace = True
        elif kind == "fred":
            ck = fred_cache_key_for_meta(meta)
            ser = fred.get(ck, pd.Series(dtype=float))
            if add_trace_line(ser, meta["label"], sec_y, meta.get("normalize", False)):
                any_trace = True
        elif kind == "taiwan_macro":
            # 台灣巨觀數據在 load_panel 已使用 sid 作為 key 放入快取
            ser = fred.get(sid, pd.Series(dtype=float))
            if add_trace_line(ser, meta["label"], sec_y, meta.get("normalize", False)):
                any_trace = True

    fig.update_layout(
        title="台美股指與總經指標（雙 Y 軸）",
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=-0.28, x=0),
        height=640,
        margin=dict(b=120),
    )
    fig.update_xaxes(title_text="日期")

    if n_sel == 2:
        left_title = "左 Y 軸（第 1 項）"
        right_title = "右 Y 軸（第 2 項）"
    elif n_sel >= 3:
        left_title = "左：股指／指數化／擴散（起伏較大）"
        right_title = "右：利率 · 年增率（%）（起伏較小）"
    else:
        left_title = "數值"
        right_title = ""

    fig.update_yaxes(title_text=left_title, secondary_y=False)
    fig.update_yaxes(title_text=right_title or left_title, secondary_y=True)

    if not any_trace:
        fig.add_annotation(
            text="請在側邊欄勾選至少一項指標",
            xref="paper",
            yref="paper",
            x=0.5,
            y=0.5,
            showarrow=False,
            font=dict(size=16),
        )

    return fig


def main() -> None:
    st.set_page_config(page_title="總經指標儀表板", layout="wide")
    st.title("台美股指與總經指標")
    st.caption(
        "資料來源：yfinance（股指）、FRED JSON API（美國總經與台灣 CPI）、"
        "FinMind／模擬（台灣 M1b/M2）。選兩項時左／右軸各一條；選三項以上時依起伏大小分流（股指與指數化為左，%、年增為右）。"
    )

    today = date.today()
    data_start_limit = date(2000, 1, 1)
    default_start = date(today.year - 10, 1, 1)

    with st.sidebar:
        st.header("日期範圍")
        low, high = st.slider(
            "選擇區間（拖曳調整）",
            min_value=data_start_limit,
            max_value=today,
            value=(default_start, today),
            help="拖曳兩端以選擇起訖日期（年月日）。",
        )
        st.caption(f"**{low.isoformat()}** ～ **{high.isoformat()}**")

        st.header("台灣資料來源")
        prefer_finmind = st.checkbox("優先使用 FinMind API", value=False)
        manual_token = st.text_input(
            "FinMind Token（可選，亦可設定環境變數 FINMIND_TOKEN 或 .streamlit/secrets.toml）",
            type="password",
            help="無 token 仍可呼叫 API（較嚴格流量限制）；失敗時自動改用模擬資料。",
        )
        token_resolved = manual_token.strip() or _secrets_token()

        st.header("指標選擇")
        st.subheader("領先指標")
        leading_keys = [k for k, v in SERIES_META.items() if v["group"] == "leading"]
        lead_sel = {k: st.checkbox(SERIES_META[k]["label"], key=f"cb_{k}") for k in leading_keys}

        st.subheader("同時指標")
        coincident_keys = [k for k, v in SERIES_META.items() if v["group"] == "coincident"]
        coin_sel = {k: st.checkbox(SERIES_META[k]["label"], key=f"cb_{k}") for k in coincident_keys}

        st.subheader("落後指標")
        lag_keys = [k for k, v in SERIES_META.items() if v["group"] == "lagging"]
        lag_sel = {k: st.checkbox(SERIES_META[k]["label"], key=f"cb_{k}") for k in lag_keys}

        st.divider()
        st.markdown("**環境變數** `FRED_API_KEY`：由 [FRED](https://fred.stlouisfed.org/docs/api/api_key.html) 申請後設定，以抓取美國總經序列。")

    selected = {**lead_sel, **coin_sel, **lag_sel}

    finmind_token_s = token_resolved if token_resolved else None
    panel = load_panel(
        low.isoformat(),
        high.isoformat(),
        prefer_finmind,
        finmind_token_s,
    )

    sim_parts: list[str] = []
    live_parts: list[str] = []
    if panel["tw_money_simulated"]:
        sim_parts.append("台灣 M1b/M2")
    # 目前 FinMind 的台灣貨幣供給 API 似乎不開放，所以預期都是模擬數據。
    # 如果未來 FinMind 數據可用，這裡的邏輯需要調整以區分 M1b 和 M2 的來源。
    # 暫時假設如果 FinMind 成功，它能提供 M1b 和 M2。
    # 由於目前的 try_finmind_taiwan_money_supply 返回 None，此處將始終走模擬分支。
    if sim_parts:
        st.info(
            "以下為**模擬資料**："
            + "、".join(sim_parts)
            + "（未勾選 FinMind、無 token、API 失敗或回傳欄位無法解析時會退回模擬）。",
            icon="ℹ️",
        )
    if live_parts: # 目前此分支不會被觸發，但保留以備未來 FinMind 數據可用時使用
        st.success("已使用 FinMind API：" + "、".join(live_parts) + "。", icon="✓")

    if _fred_api_key() is None:
        st.warning("未偵測到 **FRED_API_KEY**，美國 FRED 序列可能為空。請設定環境變數後重新整理。", icon="⚠️")

    fig = build_figure(panel, low, high, selected)
    st.plotly_chart(fig, width="stretch")


if __name__ == "__main__":
    main()

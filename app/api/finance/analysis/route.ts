import { NextRequest, NextResponse } from "next/server";

type RequestBody = {
  markdown?: string;
};

type GeminiErrorPayload = {
  error?: {
    code?: number;
    status?: string;
    message?: string;
  };
};

type GeminiCandidate = {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
};

function getGeminiApiKey(): string | undefined {
  return process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
}

function buildTroubleshootingTips(status?: string, code?: number): string[] {
  const tips: string[] = [];
  if (status === "UNAUTHENTICATED" || code === 401) {
    tips.push("API Key 無效、過期，或未正確設定到執行環境。");
    tips.push("請確認有設定 GOOGLE_AI_API_KEY（或 GEMINI_API_KEY）並重啟服務。");
  } else if (status === "PERMISSION_DENIED" || code === 403) {
    tips.push("目前金鑰或專案對 Gemini API 沒有權限。");
    tips.push("請檢查 Google AI Studio 專案與 API 啟用狀態。");
  } else if (status === "RESOURCE_EXHAUSTED" || code === 429) {
    tips.push("已超過速率限制或配額限制，請稍後再試。");
  } else if (status === "NOT_FOUND" || code === 404) {
    tips.push("模型名稱不存在或目前區域不可用。");
  } else {
    tips.push("請確認 API Key、網路連線、與模型可用性。");
  }
  return tips;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RequestBody;
  const markdown = body.markdown?.trim();
  if (!markdown) {
    return NextResponse.json({ error: "缺少 markdown 內容" }, { status: 400 });
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "尚未設定 GOOGLE_AI_API_KEY（或 GEMINI_API_KEY），無法呼叫 Google AI 分析。",
      },
      { status: 400 },
    );
  }

  const model = "gemini-2.0-flash";
  const prompt = [
    "你是一位繁體中文總經分析師。",
    "請根據以下 markdown 指標資料，提供：",
    "1) 總結當前景氣狀態",
    "2) 2-4 個關鍵觀察（用條列）",
    "3) 1-2 個可能風險與後續觀察重點",
    "請避免投資建議與保證性語句，保持中性、具體、可讀。",
    "",
    "資料如下：",
    markdown,
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let detailText = "";
    let status: string | undefined;
    let code: number | undefined;
    let message: string | undefined;
    try {
      const detailJson = (await response.json()) as GeminiErrorPayload;
      detailText = JSON.stringify(detailJson);
      status = detailJson.error?.status;
      code = detailJson.error?.code ?? response.status;
      message = detailJson.error?.message;
    } catch {
      detailText = await response.text();
      code = response.status;
    }

    const tips = buildTroubleshootingTips(status, code);
    return NextResponse.json(
      {
        error: "Google AI 分析失敗",
        status,
        code,
        message: message ?? "未取得詳細錯誤訊息",
        tips,
        detail: detailText,
      },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as {
    candidates?: GeminiCandidate[];
  };
  const text =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) {
    return NextResponse.json(
      {
        error: "Google AI 未回傳可用分析文字",
        tips: [
          "模型回應可能被安全規則過濾，或回傳內容為空。",
          "請稍後重試，或縮短輸入內容後再試一次。",
        ],
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ analysis: text, model });
}

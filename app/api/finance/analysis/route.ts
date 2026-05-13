import { NextRequest, NextResponse } from "next/server";

type RequestBody = {
  markdown?: string;
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
    const detail = await response.text();
    return NextResponse.json(
      { error: "Google AI 分析失敗", detail },
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
      { error: "Google AI 未回傳可用分析文字" },
      { status: 502 },
    );
  }

  return NextResponse.json({ analysis: text, model });
}

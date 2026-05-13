"use client";

import { useEffect, useState } from "react";

type ReactionKind = "like" | "heart";

type Comment = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

type InteractionResponse = {
  reactions: Record<ReactionKind, number>;
  comments: Comment[];
  error?: string;
};

type Props = {
  category: string;
  slug: string;
};

function formatCommentDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-Hant-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostInteractions({ category, slug }: Props) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InteractionResponse>({
    reactions: { like: 0, heart: 0 },
    comments: [],
  });
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const endpoint = `/api/posts/${encodeURIComponent(category)}/${encodeURIComponent(slug)}/interactions`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(endpoint)
      .then((res) => res.json())
      .then((json: InteractionResponse) => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error);
          return;
        }
        setData({
          reactions: json.reactions ?? { like: 0, heart: 0 },
          comments: json.comments ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) setError("互動資料載入失敗，請稍後再試");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  async function mutate(payload: {
    action: "react";
    reaction: ReactionKind;
  } | {
    action: "comment";
    name: string;
    message: string;
  }) {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as InteractionResponse;
      if (!response.ok || json.error) {
        throw new Error(json.error || "操作失敗，請稍後再試");
      }
      setData({
        reactions: json.reactions ?? { like: 0, heart: 0 },
        comments: json.comments ?? [],
      });
      if (payload.action === "comment") {
        setMessage("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteByAdmin(commentId: string) {
    setDeletingId(commentId);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken.trim(),
        },
        body: JSON.stringify({ commentId }),
      });
      const json = (await response.json()) as InteractionResponse;
      if (!response.ok || json.error) {
        throw new Error(
          json.error === "admin_unauthorized"
            ? "管理權限驗證失敗，請確認 admin token。"
            : json.error || "刪除留言失敗",
        );
      }
      setData({
        reactions: json.reactions ?? { like: 0, heart: 0 },
        comments: json.comments ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除留言失敗");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-stone-200/80 bg-white/60 p-5 sm:p-6">
      <h2 className="font-display text-2xl font-semibold text-stone-900">互動回饋</h2>
      <p className="mt-1 text-sm text-stone-600">喜歡這篇內容的話，按個讚、留句話吧。</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void mutate({ action: "react", reaction: "like" })}
          disabled={loading || submitting}
          className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          👍 讚（{data.reactions.like}）
        </button>
        <button
          type="button"
          onClick={() => void mutate({ action: "react", reaction: "heart" })}
          disabled={loading || submitting}
          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          ❤️ 愛心（{data.reactions.heart}）
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="text-base font-semibold text-stone-900">留言</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-stone-700">
            暱稱
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="請輸入你的名字"
              className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            />
          </label>
          <span className="self-end text-right text-xs text-stone-500">
            最多 30 字
          </span>
        </div>
        <label className="mt-3 block text-sm text-stone-700">
          內容
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="想說些什麼..."
            className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
          />
        </label>
        <div className="mt-2 text-right text-xs text-stone-500">
          {message.length}/500
        </div>
        <button
          type="button"
          onClick={() => void mutate({ action: "comment", name, message })}
          disabled={loading || submitting}
          className="mt-3 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          送出留言
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="text-base font-semibold text-stone-900">管理模式（刪留言）</h3>
        <p className="mt-1 text-xs text-stone-500">
          輸入 admin token 後，留言卡片會出現刪除按鈕。
        </p>
        <label className="mt-2 block text-sm text-stone-700">
          Admin Token
          <input
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="請輸入 POST_INTERACTIONS_ADMIN_TOKEN"
            className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-base font-semibold text-stone-900">
          留言列表（{data.comments.length}）
        </h3>
        {data.comments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">
            還沒有留言，歡迎成為第一位留言者。
          </p>
        ) : (
          data.comments
            .slice()
            .reverse()
            .map((comment) => (
              <article
                key={comment.id}
                className="rounded-lg border border-stone-200 bg-white px-3 py-3"
              >
                <p className="text-sm font-semibold text-stone-900">{comment.name}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
                  {comment.message}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  {formatCommentDate(comment.createdAt)}
                </p>
                {adminToken.trim() && (
                  <button
                    type="button"
                    onClick={() => void deleteByAdmin(comment.id)}
                    disabled={Boolean(deletingId) || submitting}
                    className="mt-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === comment.id ? "刪除中..." : "刪除留言"}
                  </button>
                )}
              </article>
            ))
        )}
      </div>
    </section>
  );
}

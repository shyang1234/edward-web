import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isCategorySlug } from "@/lib/categories";
import {
  addComment,
  getPostInteractions,
  incrementReaction,
  type ReactionKind,
} from "@/lib/post-interactions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ category: string; slug: string }> };

type ReactionBody = {
  action: "react";
  reaction: ReactionKind;
};

type CommentBody = {
  action: "comment";
  name: string;
  message: string;
};

type RequestBody = ReactionBody | CommentBody;

function postKey(category: string, slug: string): string {
  return `${category}/${slug}`;
}

function validateComment(name: string, message: string): string | null {
  const n = name.trim();
  const m = message.trim();
  if (!n) return "留言名稱不可空白";
  if (!m) return "留言內容不可空白";
  if (n.length > 30) return "留言名稱不可超過 30 字";
  if (m.length > 500) return "留言內容不可超過 500 字";
  return null;
}

async function ensurePostExists(category: string, slug: string): Promise<boolean> {
  if (!isCategorySlug(category)) return false;
  const filePath = path.join(process.cwd(), "content", category, `${slug}.md`);
  return fs.existsSync(filePath);
}

export async function GET(_: NextRequest, { params }: Params) {
  const { category, slug } = await params;
  if (!(await ensurePostExists(category, slug))) {
    return NextResponse.json({ error: "post_not_found" }, { status: 404 });
  }

  try {
    const data = await getPostInteractions(postKey(category, slug));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "storage_unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { category, slug } = await params;
  if (!(await ensurePostExists(category, slug))) {
    return NextResponse.json({ error: "post_not_found" }, { status: 404 });
  }

  const body = (await request.json()) as RequestBody;

  try {
    if (body.action === "react") {
      if (body.reaction !== "like" && body.reaction !== "heart") {
        return NextResponse.json({ error: "invalid_reaction" }, { status: 400 });
      }
      const data = await incrementReaction(
        postKey(category, slug),
        body.reaction,
      );
      return NextResponse.json(data);
    }

    if (body.action === "comment") {
      const validationError = validateComment(body.name, body.message);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
      const data = await addComment(postKey(category, slug), {
        name: body.name,
        message: body.message,
      });
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "storage_unavailable" },
      { status: 503 },
    );
  }
}

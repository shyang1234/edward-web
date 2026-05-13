import fs from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";

export type ReactionKind = "like" | "heart";

export type PostComment = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

export type PostInteractionState = {
  reactions: Record<ReactionKind, number>;
  comments: PostComment[];
};

const DATA_FILE = path.join(process.cwd(), "data", "post-interactions.json");

type FileStore = {
  posts: Record<
    string,
    {
      reactions: Partial<Record<ReactionKind, number>>;
      comments: PostComment[];
    }
  >;
};

function getUpstashEnv(): { url: string | undefined; token: string | undefined } {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

function useUpstash(): boolean {
  const { url, token } = getUpstashEnv();
  return Boolean(url && token);
}

function reactionKey(postKey: string): string {
  return `post:reactions:${postKey}`;
}

function commentKey(postKey: string): string {
  return `post:comments:${postKey}`;
}

function parseCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const num = parseInt(value, 10);
    if (Number.isFinite(num) && num >= 0) return num;
  }
  return 0;
}

function toPostComment(value: unknown): PostComment | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PostComment>;
  if (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.createdAt === "string"
  ) {
    return {
      id: candidate.id,
      name: candidate.name,
      message: candidate.message,
      createdAt: candidate.createdAt,
    };
  }
  return null;
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw) as FileStore;
    if (!data || typeof data !== "object" || !data.posts) {
      return { posts: {} };
    }
    return data;
  } catch {
    return { posts: {} };
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function normalizeState(input?: {
  reactions?: Partial<Record<ReactionKind, number>>;
  comments?: PostComment[];
}): PostInteractionState {
  const reactions = {
    like: parseCount(input?.reactions?.like),
    heart: parseCount(input?.reactions?.heart),
  };
  const comments = Array.isArray(input?.comments) ? input.comments : [];
  return { reactions, comments };
}

export async function getPostInteractions(postKey: string): Promise<PostInteractionState> {
  if (useUpstash()) {
    const redis = Redis.fromEnv();
    const [likeRaw, heartRaw, commentsRaw] = await Promise.all([
      redis.hget(reactionKey(postKey), "like"),
      redis.hget(reactionKey(postKey), "heart"),
      redis.lrange(commentKey(postKey), 0, -1),
    ]);

    const comments: PostComment[] = [];
    if (Array.isArray(commentsRaw)) {
      for (const item of commentsRaw) {
        if (typeof item === "string") {
          try {
            const parsed = JSON.parse(item) as unknown;
            const normalized = toPostComment(parsed);
            if (normalized) comments.push(normalized);
          } catch {
            // ignore malformed comment
          }
          continue;
        }
        const normalized = toPostComment(item);
        if (normalized) comments.push(normalized);
      }
    }

    return {
      reactions: {
        like: parseCount(likeRaw),
        heart: parseCount(heartRaw),
      },
      comments,
    };
  }

  const store = await readFileStore();
  return normalizeState(store.posts[postKey]);
}

export async function incrementReaction(
  postKey: string,
  reaction: ReactionKind,
): Promise<PostInteractionState> {
  if (useUpstash()) {
    const redis = Redis.fromEnv();
    await redis.hincrby(reactionKey(postKey), reaction, 1);
    return getPostInteractions(postKey);
  }

  const store = await readFileStore();
  const current = normalizeState(store.posts[postKey]);
  current.reactions[reaction] += 1;
  store.posts[postKey] = current;
  await writeFileStore(store);
  return current;
}

export async function addComment(
  postKey: string,
  input: { name: string; message: string },
): Promise<PostInteractionState> {
  const comment: PostComment = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  };

  if (useUpstash()) {
    const redis = Redis.fromEnv();
    await redis.rpush(commentKey(postKey), JSON.stringify(comment));
    return getPostInteractions(postKey);
  }

  const store = await readFileStore();
  const current = normalizeState(store.posts[postKey]);
  current.comments.push(comment);
  store.posts[postKey] = current;
  await writeFileStore(store);
  return current;
}

import fs from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";

const DATA_FILE = path.join(process.cwd(), "data", "visitor-count.json");
const REDIS_KEY = "visitor-count";

type Store = { count: number };

function useUpstash(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw) as Store;
    return typeof data.count === "number" && data.count >= 0
      ? data
      : { count: 0 };
  } catch {
    return { count: 0 };
  }
}

async function writeStore(count: number): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify({ count }, null, 2),
    "utf-8",
  );
}

function parseRedisCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  return 0;
}

export async function getVisitorCount(): Promise<number> {
  if (useUpstash()) {
    const redis = Redis.fromEnv();
    const v = await redis.get(REDIS_KEY);
    return parseRedisCount(v);
  }

  const { count } = await readStore();
  return count;
}

export async function incrementVisitorCount(): Promise<number> {
  if (useUpstash()) {
    const redis = Redis.fromEnv();
    const next = await redis.incr(REDIS_KEY);
    return typeof next === "number" ? next : parseRedisCount(next);
  }

  const { count } = await readStore();
  const next = count + 1;
  await writeStore(next);
  return next;
}

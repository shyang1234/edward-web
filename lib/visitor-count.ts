import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "visitor-count.json");

type Store = { count: number };

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

export async function getVisitorCount(): Promise<number> {
  const { count } = await readStore();
  return count;
}

export async function incrementVisitorCount(): Promise<number> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const { count } = await readStore();
  const next = count + 1;
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify({ count: next }, null, 2),
    "utf-8",
  );
  return next;
}

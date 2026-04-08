/**
 * 掃描 content 底下所有 .md 中的 ![...](/path) 本機路徑，確認 public 下檔案存在。
 * 在 npm run build 前由 prebuild 自動執行（與 Vercel 預設 npm run build 一致）。
 * https 外部圖不檢查（避免 CI 依賴網路）。
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const contentDir = path.join(root, "content");
const publicDir = path.join(root, "public");

/** @param {string} dir @returns {string[]} */
function collectMarkdownFiles(dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) out.push(...collectMarkdownFiles(p));
    else if (name.name.endsWith(".md")) out.push(p);
  }
  return out;
}

// ![alt](url) — url 不含空白為主
const IMG_RE = /!\[[^\]]*\]\(([^)\s]+)\)/g;

function main() {
  /** @type {string[]} */
  const errors = [];
  const files = collectMarkdownFiles(contentDir);

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    let m;
    IMG_RE.lastIndex = 0;
    while ((m = IMG_RE.exec(text)) !== null) {
      const rawUrl = m[1];
      if (/^https?:\/\//i.test(rawUrl)) continue;
      if (!rawUrl.startsWith("/")) {
        errors.push(`${file}: 相對路徑請用 / 開頭或 https，目前為：${rawUrl}`);
        continue;
      }
      const rel = rawUrl.replace(/^\//, "");
      const abs = path.join(publicDir, rel);
      if (!fs.existsSync(abs)) {
        errors.push(`${file}: 找不到檔案 public/${rel}`);
      }
    }
  }

  if (errors.length) {
    console.error("[verify-assets] 以下 Markdown 圖片路徑無對應 public 檔案：\n");
    for (const e of errors) console.error("  •", e);
    console.error(
      "\n請把圖放在 public/ 底下（網址 /foo.png → public/foo.png），或改成正確路徑。",
    );
    process.exit(1);
  }
  console.log("[verify-assets] OK —", files.length, "個 .md 中的本機圖片路徑皆可對應 public/");
}

main();

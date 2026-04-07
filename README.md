# 木哥的書房筆記網站

以 **Next.js** 建置的靜態內容網站，文章放在 `content/` 以 **Markdown** 撰寫，分類如下：

| 資料夾 | 網址路徑 | 說明 |
|--------|----------|------|
| `content/reading/` | `/reading` | 讀書心得 |
| `content/advice-daughter/` | `/advice-daughter` | 給女兒的建議 |
| `content/growth/` | `/growth` | 成長歷程 |
| `content/finance/` | `/finance` | 財務追蹤（未來可擴充經濟指標、個股筆記等） |

分類中文名稱與說明可在 `lib/categories.ts` 修改。

### 外觀與背景圖

- 全站背景為**高山／草原意象**（預設使用 Unsplash 圖片），程式在 `components/SiteBackground.tsx`。
- 若要改成**自攝合歡山**：將照片放到 `public/mountain-bg.jpg`，並把 `SiteBackground.tsx` 裡的 `<Image>` 改成 `src="/mountain-bg.jpg"`（可刪除遠端網址）。
- 首頁分類卡與列表圖示為專案內 **內嵌 SVG**（`components/svg-icons.tsx`），不需額外安裝圖示套件；讀書列表會輪替不同書本圖示，財務列表輪替走勢／錢包／硬幣等圖示。
- **版面**：主內容區約為 `max-w-6xl`（72rem / 約 1152px），中文一行約 **45 字**；大螢幕右側為 **側欄**（`components/Sidebar.tsx`）：全部分類連結 + 全站最新 10 篇文章（依 front matter 的 `date`）。

## 本機開發

此步驟會在本機啟動開發伺服器，可在瀏覽器預覽網頁：

如果你是在 Windows 並使用 Cursor 編輯器，可以直接在下方「TERMINAL」視窗輸入以下指令（即使不是 Bash 也可正常執行）：
> **⚠️ 如果你和上圖一樣在 Windows 的 PowerShell 終端看到 `npm` 指令找不到，表示你的電腦還沒有安裝 [Node.js](https://nodejs.org/) 與 npm。**

請到 [Node.js 官網下載頁](https://nodejs.org/zh-tw/download) 下載安裝，選擇「LTS」版本（推薦）。安裝過程中預設都有勾選 npm，只要一路下一步即可。

安裝完後，請重新開啟一個終端機視窗，執行以下指令確認安裝成功：

```powershell
node -v
npm -v
```

如果能分別正確顯示版本號，代表安裝沒問題，再繼續執行本文後續指令即可。

---

### ❓ 如果你在 PowerShell 裡 `npm` 還是無法執行，但在 Bash（例如 Git Bash）裡可以，通常是「環境變數（PATH）」沒有正確加到 PowerShell。

- **為什麼？**  
  Node.js 安裝時會把路徑加到你的使用者環境變數，但如果 PowerShell 沒有重新啟動、或 Windows 有路徑快取、或安裝勾選有異，PowerShell 可能沒讀到新的路徑。而有些 Bash（像 Git Bash）會額外去找常用的安裝路徑，因此可以用。

- **解法：**
    1. **關閉所有 PowerShell，再重新開啟試一次。**
    2. **輸入 `echo $env:PATH` 檢查路徑裡有沒有 Node.js 的安裝路徑（預設像 `C:\Program Files\nodejs\`）。**
    3. **如果沒有，可手動把 Node.js 安裝路徑加到「環境變數」中的 PATH，然後重開 PowerShell。**  
       參考 [微軟官方教學](https://learn.microsoft.com/zh-tw/windows/deployment/usmt/usmt-recognized-environment-variables)：「編輯系統環境變數」。

- 通常，日後都用 Bash 或直接用 WSL 也沒問題，只要你習慣即可。

如遇問題，可參考 Node.js 官網說明或搜尋「安裝 Node.js PowerShell 路徑」來解決常見障礙。

```bash
npm install
npm run dev
```

瀏覽 <http://localhost:3000>。

## 新增文章

在對應分類資料夾新增 `檔名.md`，檔名（不含 `.md`）會成為網址，例如 `content/reading/原子習慣.md` → `/reading/原子習慣`。

### 如何將 docx 檔案轉成 Markdown 或直接使用 docx？

目前本專案建議的做法如下：

#### 1. 將 docx 檔轉為 Markdown

你可以使用開源工具將 .docx 轉成 .md 檔案，再放入對應的 `content/` 資料夾。推薦工具有：

- [pandoc](https://pandoc.org/):  
  安裝 pandoc 後，在終端機輸入以下指令即可轉換：

  ```bash
  pandoc input.docx -f docx -t markdown -o output.md
  ```

  > **如果 docx 內有圖片，pandoc 也會自動將圖片提取出來並儲存到指定資料夾（預設是同目錄的 `media` 資料夾），Markdown 內會自動加入圖片參考路徑。**  
  > 建議轉換時加上 `--extract-media=./media`（或指定資料夾），圖片會被一併導出，轉換後 md 內容可正常引用本機圖片。
  >
  > 例如：
  > ```bash
  > pandoc input.docx -f docx -t markdown -o output.md --extract-media=./media
  > ```
  > 轉換後記得把 `output.md` 及 `media` 資料夾都放到專案的 content 對應路徑下。

- [docx2md 線上工具](https://docx2md.com/):  
  直接上傳 docx，即可下載 md 檔（但部分圖片可能需要另外手動補圖）。

#### 2. 直接讀取 docx？

目前專案架構是讀取 Markdown 轉為前端網頁，**暫不支援直接讀取 .docx**。如果未來有大量需求，可以考慮新增 docx 解析邏輯，但建議還是統一格式，便於版本控管與顯示一致性。

#### 3. 轉換建議

- 建議用 Word 另存為「純文字」(txt) 或 markdown，再編輯細節（如圖片、表格格式等）。
- 若排版複雜，建議轉成 markdown 後再人工微調。

如需自動化或批量處理轉換，可研究 pandoc 串接腳本。

歡迎於 Issues 討論 docx 導入需求。

開頭 **front matter** 範例：

```yaml
---
title: "文章標題"
date: "2025-03-18"
description: "一句話摘要（選填）"
draft: false
---
```

內文使用標準 Markdown。若設 `draft: true`，網站不會顯示該篇。

## 部署到 GitHub + Vercel

1. 在 GitHub 建立新 repository，將此專案 push 上去。
2. 登入 [Vercel](https://vercel.com)，**Import** 該 repository。
3. Framework Preset 選 **Next.js**，Build Command 預設 `next build`，直接 Deploy。
4. 之後每次 push 到預設分支，Vercel 會自動重新建置。

### 環境變數

目前專案不需 API key。若未來在「財務追蹤」串接即時資料，請在 Vercel 專案 **Settings → Environment Variables** 設定，**勿**將金鑰寫進程式碼。

## 專案結構（精簡）

```
├── app/                    # 頁面與路由
│   ├── page.tsx            # 首頁（分類入口）
│   ├── [category]/         # 分類列表
│   └── [category]/[slug]/   # 單篇文章
├── components/             # UI（SiteBackground、側欄 Sidebar、內嵌圖示等）
├── content/                # Markdown 文章（主要編輯區）
├── lib/
│   ├── categories.ts       # 分類定義
│   ├── categoryVisuals.ts  # 分類配色／漸層
│   └── posts.ts            # 讀取 Markdown、`getLatestPosts`（側欄最新文章）
├── package.json
└── README.md
```

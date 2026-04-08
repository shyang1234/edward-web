import Image from "next/image";

/** `public/mountain-bg.jpg` 在網址上為根路徑 `/mountain-bg.jpg`（勿寫成 `/public/...`） */
const MOUNTAIN_MEADOW_SRC = "/mountain-bg.jpg";

/**
 * 高山／草原意象背景（自攝圖：放 `public/mountain-bg.jpg`）
 */export function SiteBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <Image
        src={MOUNTAIN_MEADOW_SRC}
        alt=""
        fill
        priority
        className="object-cover object-[center_35%] scale-105"
        sizes="100vw"
        quality={85}
      />
      {/* 天空藍 + 草原綠 + 底部加深，讓文字區可讀 */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-sky-400/35 via-emerald-800/25 to-stone-900/55"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-sky-100/20"
        aria-hidden
      />
      {/* 細紋理 */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
    </div>
  );
}

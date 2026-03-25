import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { strokeWidth?: number };

function baseProps(className?: string, strokeWidth = 2): SVGProps<SVGSVGElement> {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };
}

export function IconSparkles({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

export function IconMountain({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

export function IconBookOpen({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function IconBookMarked({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18l-7-3.5-7 3.5v-15A2.5 2.5 0 0 1 6.5 2" />
      <path d="m10 6 1.5 3L14 6" />
    </svg>
  );
}

export function IconLibrary({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  );
}

export function IconBookCopy({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="M2 16V4a2 2 0 0 1 2-2h11" />
      <path d="M22 18H11a2 2 0 1 0 0 4h10" />
      <path d="M18 22V2v20Z" />
      <path d="M6 12H4" />
      <path d="M6 8H4" />
      <path d="M6 16H4" />
    </svg>
  );
}

export function IconLineChart({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

export function IconTrendingUp({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function IconCoins({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16 19 2 2 4-4" />
    </svg>
  );
}

export function IconWallet({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

export function IconHeart({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function IconMail({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function IconGift({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

export function IconSparklesSmall({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

export function IconSprout({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5-1-5.5-.5 1.2-1.9 3-2.8 5-2.2Z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.8 4.9-1.8-.6-1.7-1.5-3.3-3.8-2.2Z" />
    </svg>
  );
}

export function IconTreePine({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.4-1.9L9 11h-.2L7 8.3a1 1 0 0 1 .6-1.7h8.8a1 1 0 0 1 .6 1.7L15 11h.2l2.7 1.1a1 1 0 0 1-.4 1.9H17Z" />
      <path d="M12 22v-3" />
    </svg>
  );
}

export function IconLeaf({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

export function IconFlower2({ className, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg {...baseProps(className, strokeWidth)} {...rest}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M12 18v4" />
    </svg>
  );
}


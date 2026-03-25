import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          50: "#faf8f5",
          100: "#f0ebe3",
          200: "#ddd4c4",
          300: "#c4b69f",
          400: "#9a8b72",
          500: "#7a6b56",
          600: "#5d5244",
          700: "#4a4238",
          800: "#3d362f",
          900: "#342e28",
          950: "#1c1915",
        },
        accent: {
          DEFAULT: "#2d6a4f",
          muted: "#40916c",
          light: "#95d5b2",
        },
      },
    },
  },
  plugins: [typography],
};

export default config;

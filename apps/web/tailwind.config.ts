import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        // Airbnb Cereal VF is proprietary; the reference recommends DM Sans
        // as the open substitute (geometric, round terminals, 400/500/700
        // variable weights), with the platform stack as fallback.
        sans: ["DM Sans", "Circular", "-apple-system", "system-ui", "Roboto", "Helvetica Neue", "sans-serif"],
        arabic: ["Cairo", "Tajawal", "Noto Sans Arabic", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      colors: {
        brand: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#111827",
          700: "#0B0F19",
          800: "#05070A",
          900: "#000000",
        },
        neutral: {
          0: "#FFFFFF",
          50: "#FAFAFA",
          100: "#F5F5F5",
          150: "#EBEBEB",
          200: "#E5E5E5",
          300: "#D4D4D4",
          // Reference hairline #DDDDDD — search-pill outline, segment
          // dividers, photo placeholder fill.
          hairline: "#DDDDDD",
          // Reference ladder #6C6C6C / #8C8C8C / #C1C1C1 for meta,
          // tertiary and disabled text (MAKAZOH keeps #6B7280 primary
          // secondary text; these map the reference's lighter steps).
          muted: "#6C6C6C",
          mutedSoft: "#8C8C8C",
          disabled: "#C1C1C1",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        success: {
          50: "#F7FEE7",
          100: "#ECFCCB",
          500: "#84CC16",
          600: "#65A30D",
          700: "#4D7C0F",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          400: "#FBBF24",
          500: "#F59E0B",
          700: "#B45309",
        },
        danger: {
          50: "#FFF5F5",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        info: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          500: "#22C55E",
          700: "#15803D",
        },
        accent: {
          100: "#ECFCCB",
          200: "#D9F99D",
          300: "#BEF264",
          400: "#A3E635",
          500: "#84CC16",
          600: "#65A30D",
          700: "#4D7C0F",
          800: "#3F6212",
          900: "#365314",
        },
      },
      backgroundColor: {
        // Reference surface ladder: white canvas, #F2F2F2 chip/soft
        // fills, #F7F7F7 footer band + hover fills.
        "surface-page": "#FFFFFF",
        "surface-card": "#FFFFFF",
        "surface-sidebar": "#FFFFFF",
        "surface-nav": "#FFFFFF",
        "surface-input": "#FFFFFF",
        "surface-input-disabled": "#F9FAFB",
        "surface-hover": "#F7F7F7",
        "surface-soft": "#F2F2F2",
        "surface-footer": "#F7F7F7",
        "surface-selected": "#EEF2FF",
      },
      spacing: {
        "4xs": "2px",
        "3xs": "4px",
        "2xs": "8px",
        xs: "12px",
        sm: "16px",
        md: "24px",
        lg: "32px",
        xl: "48px",
        "2xl": "64px",
        "3xl": "96px",
        "4xl": "128px",
      },
      boxShadow: {
        // Measured Airbnb-reference elevation. Shadows belong to things
        // that float, never to content. Nothing darker than 0.12 alpha;
        // every stack starts with an almost-invisible 0.02-alpha 1px edge.
        xs: "0 1px 2px rgba(0,0,0,0.04)",
        // Condensed search bar on inner pages (+ 1px #DDDDDD border).
        sm: "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
        // Floating category tiles (+ 1px #F2F2F2 border).
        md: "0 4px 20px rgba(0,0,0,0.12)",
        lg: "0 6px 16px rgba(0,0,0,0.12)",
        xl: "0 8px 28px rgba(0,0,0,0.16)",
        card: "0 0 0 1px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.04)",
        "card-hover": "0 0 0 1px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.08)",
        // Page-level layered stack — menus, popovers, booking panel.
        menu: "0 0 0 1px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.10)",
        overlay: "0 6px 16px rgba(0,0,0,0.12)",
        // Hero search pill (+ 1px #DDDDDD border).
        capsule:
          "0 0 0 1px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.10)",
        // Reference focus ring: 2px white inner + 4px ink outer.
        "focus-ring": "0 0 0 2px #FFFFFF, 0 0 0 4px #111827",
      },
      letterSpacing: {
        // title-lg 22px/-0.44px and title-md 20px/-0.18px — the only
        // tightened steps in the reference ladder.
        "title-tight": "-0.02em",
        "title-md": "-0.009em",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        // Content panels use the reference's 14px secondary-container
        // step; photo/listing cards use 20px (rounded-2xl) directly.
        card: "14px",
        pill: "9999px",
      },
    },
  },
  plugins: [
    // tailwindcss-rtl provides logical property utilities for RTL/LTR
    require("tailwindcss-rtl"),
  ],
};

export default config;

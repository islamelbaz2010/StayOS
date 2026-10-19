export const colors = {
  // MAKAZOH brand: bright lime fills (with dark text), darker lime for
  // text accents, near-black typography on white/light-gray surfaces.
  primary: "#84CC16",
  primaryDark: "#65A30D",
  primaryLight: "#A3E635",
  primary50: "#F7FEE7",
  primary100: "#ECFCCB",
  onPrimary: "#1A2E05",
  accentText: "#4D7C0F",
  background: "#FFFFFF",
  surface: "#F9FAFB",
  text: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#E5E7EB",
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  star: "#FBBF24",
  white: "#FFFFFF",
  overlay: "rgba(0,0,0,0.5)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

/**
 * Airbnb-reference type scale on top of the existing scale:
 * caption 12 / ui 16 / subheading 20 / section-title 22 / page-title 28,
 * with the reference's tight -0.02em tracking on titles.
 */
export const typeScale = {
  caption: { fontSize: 12, lineHeight: 14 },
  meta: { fontSize: 14, lineHeight: 20 },
  ui: { fontSize: 16, lineHeight: 20 },
  subheading: { fontSize: 20, lineHeight: 24 },
  sectionTitle: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44 },
  pageTitle: { fontSize: 28, lineHeight: 40 },
} as const;

/**
 * Reference elevation: content cards and list rows carry NO shadow —
 * separation comes from the off-white canvas and hairlines. Shadows are
 * reserved for floating overlays (search capsule, sheets, menus).
 */
export const shadow = {
  /** Layered capsule/overlay shadow — search bars, floating menus. */
  capsule: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  /** Elevated overlays — modals, sheets, dropdowns. */
  overlay: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  /** Barely-there float for carousel arrows and pills over imagery. */
  float: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;

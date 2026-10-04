import { describe, it, expect } from "vitest";

import { formatMarkerPrice, markerHtml } from "./SearchMap";

describe("formatMarkerPrice", () => {
  it("formats integer EGP with thousands separators and no decimals (EN)", () => {
    expect(formatMarkerPrice(2658.48, "en")).toBe("2,658");
    expect(formatMarkerPrice(2900.16, "en")).toBe("2,900");
    expect(formatMarkerPrice(3141.84, "en")).toBe("3,142");
    expect(formatMarkerPrice(3987.72, "en")).toBe("3,988");
    expect(formatMarkerPrice(1570.92, "en")).toBe("1,571");
  });

  it("never emits decimal places", () => {
    expect(formatMarkerPrice(1812.6, "en")).toBe("1,813");
    expect(formatMarkerPrice(1812.6, "en")).not.toContain(".");
  });

  it("localizes digits for Arabic (AR)", () => {
    const ar = formatMarkerPrice(2658.48, "ar");
    // ar-EG uses Arabic-Indic digits
    expect(ar).toMatch(/[٠-٩]/);
    expect(ar).not.toMatch(/\./);
  });

  it("rounds rather than truncates", () => {
    expect(formatMarkerPrice(3141.84, "en")).toBe("3,142");
  });
});

describe("markerHtml", () => {
  it("renders a compact contained pill with no decimal prices", () => {
    const html = markerHtml(2658.48, "EGP", false, "en");
    expect(html).toContain("2,658 EGP");
    expect(html).not.toContain("2658.48");
    expect(html).toContain("whitespace-nowrap");
    expect(html).toContain("rounded-full");
    expect(html).toContain("text-xs");
    expect(html).toContain("max-width:120px");
    // Block-level pills collapse to ~0 inside the 0x0 icon anchor —
    // the pill must size to its content to avoid clipped text.
    expect(html).toContain("width:max-content");
    expect(html).toContain("translate(-50%,-50%)");
  });

  it("applies the active style for the highlighted marker", () => {
    const html = markerHtml(100, "EGP", true, "en");
    expect(html).toContain("bg-brand-900");
  });
});

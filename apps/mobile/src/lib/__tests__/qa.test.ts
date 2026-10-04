import { isQaLoginEnabled } from "../qa";

// NOTE: babel-preset-expo inlines EXPO_PUBLIC_* literals at build time,
// so the flag is passed explicitly here rather than via process.env.
describe("QA login gating", () => {
  it("is enabled in dev builds", () => {
    expect(isQaLoginEnabled(true, undefined)).toBe(true);
  });

  it("is enabled in QA-profile builds", () => {
    expect(isQaLoginEnabled(false, "1")).toBe(true);
  });

  it("is disabled in release/production builds", () => {
    expect(isQaLoginEnabled(false, undefined)).toBe(false);
    expect(isQaLoginEnabled(false, "0")).toBe(false);
  });
});

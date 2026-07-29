import { test, expect } from "@playwright/test";

test("mobile: homepage renders at mobile viewport", async ({ page }) => {
  const response = await page.goto("/ar");
  expect(response?.status()).not.toBe(500);
  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThan(768);
});

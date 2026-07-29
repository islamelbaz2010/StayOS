import { test, expect } from "@playwright/test";

test("smoke: homepage loads without 500", async ({ page }) => {
  const response = await page.goto("/ar");
  expect(response?.status()).not.toBe(500);
});

test("smoke: health redirects correctly from root", async ({ page }) => {
  const response = await page.goto("/");
  expect([200, 301, 302, 307, 308]).toContain(response?.status());
});

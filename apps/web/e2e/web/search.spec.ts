import { test, expect } from "@playwright/test";

test("search: page loads with correct title and direction", async ({ page }) => {
  await page.goto("/ar/search");
  expect(await page.title()).toBeTruthy();
  const html = page.locator("html");
  await expect(html).toHaveAttribute("dir", "rtl");
  await expect(html).toHaveAttribute("lang", "ar");
});

test("search: en locale has ltr direction", async ({ page }) => {
  await page.goto("/en/search");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("dir", "ltr");
  await expect(html).toHaveAttribute("lang", "en");
});

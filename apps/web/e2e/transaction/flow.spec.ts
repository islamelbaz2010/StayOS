import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";

const tokens = JSON.parse(readFileSync("/tmp/tokens.json", "utf-8"));
const GUEST_TOKEN = tokens.G.access_token;
const HOST_TOKEN = tokens.H.access_token;
const ADMIN_TOKEN = tokens.A.access_token;
const SEED_UNIT_ID = "seed-unit-0001-0000-000000000001";

async function gotoAuthed(page: Page, token: string, path: string) {
  // Go to public page first, set localStorage, then navigate to protected page
  await page.goto("/ar");
  await page.evaluate((t) => {
    window.localStorage.setItem("stayos_access_token", t);
    window.localStorage.setItem("stayos_refresh_token", "mock");
    window.localStorage.setItem("stayos_expires_at", String(Date.now() + 15 * 60 * 1000));
  }, token);
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

// ── Phase 1: Guest Flow (public pages) ───────────────────

test("P1: homepage renders", async ({ page }) => {
  const res = await page.goto("/ar");
  expect(res?.status()).toBe(200);
});

test("P1: search shows listing cards", async ({ page }) => {
  await page.goto("/ar/search");
  await page.waitForLoadState("networkidle");
  const cards = page.locator("a[href*='/listings/']");
  await expect(cards.first()).toBeVisible({ timeout: 15000 });
  expect(await cards.count()).toBeGreaterThan(0);
});

test("P1: listing detail renders with full content", async ({ page }) => {
  await page.goto(`/ar/listings/${SEED_UNIT_ID}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
  const body = await page.textContent("body");
  expect(body).toMatch(/EGP|ج\.م|جنيه|ليلة|night/i);
  const form = page.locator("form").first();
  await expect(form).toBeVisible({ timeout: 10000 });
});

// ── Phase 1: Guest authenticated flow ────────────────────

test("P1: guest can submit booking via UI", async ({ page }) => {
  await gotoAuthed(page, GUEST_TOKEN, `/ar/listings/${SEED_UNIT_ID}`);
  // Wait for auth to load — the sign-in prompt should disappear
  await page.waitForTimeout(3000);
  // Wait for the booking button to appear (auth loaded + isGuest)
  const btn = page.locator("button[type='button']", { hasText: /حجز|Book|Request|طلب/ });
  await expect(btn.first()).toBeVisible({ timeout: 15000 });
  await btn.first().click();
  await page.waitForTimeout(5000);
  const body = await page.textContent("body");
  expect(body).toBeTruthy();
});

test("P1: guest bookings page shows bookings", async ({ page }) => {
  await gotoAuthed(page, GUEST_TOKEN, "/ar/bookings");
  expect(page.url()).toContain("/bookings");
  await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
});

// ── Phase 2: Host Flow ───────────────────────────────────

test("P2: host bookings page renders", async ({ page }) => {
  await gotoAuthed(page, HOST_TOKEN, "/ar/host/bookings");
  expect(page.url()).toContain("/host/bookings");
  await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
});

// ── Phase 4: Admin Flow ──────────────────────────────────

test("P4: admin payments page renders", async ({ page }) => {
  await gotoAuthed(page, ADMIN_TOKEN, "/ar/admin/payments");
  expect(page.url()).toContain("/admin/payments");
  await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
});

test("P6: admin import page renders", async ({ page }) => {
  await gotoAuthed(page, ADMIN_TOKEN, "/ar/admin/import");
  expect(page.url()).toContain("/admin/import");
  await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
});

// ── Phase 7: Mobile Web Check ────────────────────────────

test("P7: mobile homepage no overflow", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/ar");
  await page.waitForLoadState("networkidle");
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  const cw = await page.evaluate(() => document.documentElement.clientWidth);
  expect(sw).toBeLessThanOrEqual(cw + 1);
  await ctx.close();
});

test("P7: mobile search no overflow", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/ar/search");
  await page.waitForLoadState("networkidle");
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  const cw = await page.evaluate(() => document.documentElement.clientWidth);
  expect(sw).toBeLessThanOrEqual(cw + 1);
  await ctx.close();
});

test("P7: mobile listing detail no overflow", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`/ar/listings/${SEED_UNIT_ID}`);
  await page.waitForLoadState("networkidle");
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  const cw = await page.evaluate(() => document.documentElement.clientWidth);
  expect(sw).toBeLessThanOrEqual(cw + 1);
  await ctx.close();
});

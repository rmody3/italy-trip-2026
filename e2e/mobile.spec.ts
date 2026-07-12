/**
 * Mobile-only tests — no map, full-screen itinerary, tap-to-open drawer.
 * Runs on the "mobile" project (Pixel 5 via Chromium).
 */
import { test, expect } from "@playwright/test";

test("mobile shows full itinerary (no bottom bar)", async ({ page }) => {
  await page.goto("/");
  // On mobile, TripPanel is shown directly — no bottom bar needed
  await expect(page.getByRole("heading", { name: "Italy" })).toBeVisible();
  await expect(page.getByText("NYC → Milan")).toBeVisible();
  await expect(page.getByText(/Jul 22 – Aug 6/)).toBeVisible();
});

test("mobile shows no map canvas", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);
  // MapLibre canvas should NOT exist on mobile
  const canvas = page.locator(".maplibregl-canvas-container");
  await expect(canvas).toHaveCount(0);
});

test("mobile can expand timeline rows", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button").filter({ hasText: "CAG → Paris → NYC" }).click();
  await page.waitForTimeout(350);
  await expect(page.getByText("XDQETZ").first()).toBeVisible();
});

test("mobile tapping a stay card opens location drawer", async ({ page }) => {
  await page.goto("/");
  // Lake Maggiore row is pre-expanded — Regina Palace Hotel visible
  await expect(page.getByText("Regina Palace Hotel")).toBeVisible();
  await page.getByText("Regina Palace Hotel").click();
  // LocationSheet renders as Sheet on mobile
  await expect(page.getByRole("link", { name: /See reviews & photos/i })).toBeVisible({
    timeout: 5000,
  });
});

test("mobile location drawer shows Google Maps link", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Regina Palace Hotel").click();
  const link = page.getByRole("link", { name: /See reviews & photos/i });
  await expect(link).toBeVisible({ timeout: 5000 });
  const href = await link.getAttribute("href");
  expect(href).toContain("google.com/maps");
});

test("mobile location drawer closes", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Regina Palace Hotel").click();
  const link = page.getByRole("link", { name: /See reviews & photos/i });
  await expect(link).toBeVisible({ timeout: 5000 });
  // Close button
  await page.getByRole("button", { name: "✕" }).click();
  await expect(link).not.toBeVisible({ timeout: 3000 });
});

test("mobile theme switcher works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Capri" }).click();
  await expect(page.locator("div.theme-capri")).toBeAttached();
});

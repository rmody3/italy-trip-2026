/**
 * Mobile-only tests — no map, full-screen itinerary, tap-to-open drawer.
 * Runs on the "mobile" project (Pixel 5 via Chromium).
 */
import { test, expect } from "@playwright/test";

test("mobile shows full itinerary (no bottom bar)", async ({ page }) => {
  await page.goto("/");
  // On mobile, TripPanel is shown directly — no bottom bar needed
  await expect(page.getByRole("heading", { name: "Italy" })).toBeVisible();
  await expect(page.getByText("Puglia").first()).toBeVisible();
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
  await page.getByRole("button").filter({ hasText: "Home" }).first().click();
  await page.waitForTimeout(350);
  await expect(page.getByText("XDQETZ").first()).toBeVisible();
});

test("mobile tapping a stay card opens location drawer", async ({ page }) => {
  await page.goto("/");
  // Lake Maggiore row is pre-expanded — Regina Palace Hotel visible
  await expect(page.getByText("Regina Palace Hotel")).toBeVisible();
  await page.getByText("Regina Palace Hotel").click();
  // LocationSheet renders as Sheet on mobile
  await expect(page.getByTestId("open-maps-link").first()).toBeVisible({
    timeout: 5000,
  });
});

test("mobile location drawer shows Google Maps link", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Regina Palace Hotel").click();
  const link = page.getByTestId("open-maps-link").first();
  await expect(link).toBeVisible({ timeout: 5000 });
  const href = await link.getAttribute("href");
  expect(href).toContain("google.com/maps");
});

test("mobile location drawer closes", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Regina Palace Hotel").click();
  const link = page.getByTestId("open-maps-link").first();
  await expect(link).toBeVisible({ timeout: 5000 });
  // Close button
  await page.getByRole("button", { name: "✕" }).click();
  await expect(link).not.toBeVisible({ timeout: 3000 });
});

test("mobile: tapping a place opens the bottom drawer, no side hover-card / overflow", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Regina Palace Hotel").click();
  // Bottom drawer (LocationSheet) opens...
  await expect(page.getByTestId("open-maps-link").first()).toBeVisible({ timeout: 5000 });
  // ...and the desktop side hover-card never renders on mobile
  await expect(page.getByTestId("hover-card-maps-link")).toHaveCount(0);
  // ...and nothing spills off the right edge (the reported bug)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "horizontal overflow from a mispositioned popup").toBeLessThanOrEqual(1);
});

test("mobile: tapping a transport endpoint opens that exact place", async ({ page }) => {
  await page.goto("/");
  // Lake Maggiore is pre-expanded and contains the MXP → Stresa train leg.
  await page.getByText("Milan Malpensa").first().click();
  const link = page.getByTestId("open-maps-link").first();
  await expect(link).toBeVisible({ timeout: 5000 });
  const href = await link.getAttribute("href");
  // Link points exactly at the airport, not a generic city.
  expect(decodeURIComponent(href ?? "")).toContain("Milan Malpensa Airport");
});

test("mobile theme switcher works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Capri" }).click();
  await expect(page.locator("div.theme-capri")).toBeAttached();
});

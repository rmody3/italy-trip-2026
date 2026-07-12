/**
 * Desktop-only tests — MapLibre map, sidebar, hover cards.
 * Runs on the "chromium" project (Desktop Chrome 1280x720+).
 */
import { test, expect } from "@playwright/test";

test("MapLibre canvas is rendered", async ({ page }) => {
  await page.goto("/");
  // The map is desktop-only and mounted client-side. Assert MapLibre created its
  // <canvas>, i.e. the map initialized. We use toBeAttached rather than toBeVisible
  // because headless Chromium has no GPU, so MapLibre never paints a WebGL frame and
  // leaves the canvas container visibility:hidden — the map still works for real users
  // (tiles load + pins render, covered by the sibling tests).
  await expect(page.locator(".maplibregl-canvas")).toBeAttached({ timeout: 10_000 });
});

test("MapLibre vector tiles load", async ({ page }) => {
  const tileRequests: string[] = [];
  page.on("request", req => {
    const url = req.url();
    if (url.includes("cartocdn.com") || url.includes("openfreemap") || url.includes("tiles.")) {
      tileRequests.push(url);
    }
  });
  await page.goto("/");
  await page.waitForTimeout(4000);
  expect(tileRequests.length, "No tiles loaded — map may be broken").toBeGreaterThan(0);
});

test("stay pins rendered on map", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2500);
  await expect(page.locator(".pin-stay")).toHaveCount(4);
});

test("clicking a stay pin opens location card", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2500);
  await page.locator(".pin-stay").first().click();
  await expect(page.getByTestId("open-maps-link").first()).toBeVisible();
});

test("location card closes on X", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2500);
  await page.locator(".pin-stay").first().click();
  await expect(page.getByTestId("open-maps-link").first()).toBeVisible();
  await page.getByRole("button", { name: "✕" }).click();
  await expect(page.getByTestId("open-maps-link").first()).not.toBeVisible();
});

test("clicking a stay card in sidebar opens location card", async ({ page }) => {
  await page.goto("/");
  // Lake Maggiore row is pre-expanded — "Regina Palace Hotel" should be visible
  await expect(page.getByText("Regina Palace Hotel")).toBeVisible();
  await page.getByText("Regina Palace Hotel").click();
  await expect(page.getByTestId("open-maps-link").first()).toBeVisible();
});

test("hover over stay card shows PlaceHoverCard", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Regina Palace Hotel").hover();
  await page.waitForTimeout(500);
  await expect(page.getByTestId("hover-card-maps-link").first()).toBeVisible();
});

test("switching to Capri theme changes map style", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Capri" }).click();
  await expect(page.locator("div.theme-capri")).toBeAttached();
});

test("switching to Notte theme changes map style", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Notte" }).click();
  await expect(page.locator("div.theme-notte")).toBeAttached();
});

test("Italo confirmation CCDUHP visible after expanding row", async ({ page }) => {
  await page.goto("/");
  // The Italo Milano→Firenze leg (CCDUHP) lives in the "Tuscany" arrival block.
  await page.getByRole("button").filter({ hasText: "Tuscany" }).first().click();
  await page.waitForTimeout(350);
  await expect(page.getByText("CCDUHP").first()).toBeVisible();
});

/**
 * Shared smoke tests — run on both desktop and mobile projects.
 * Only checks things that exist in both layouts (map, title, no JS errors).
 */
import { test, expect } from "@playwright/test";

function collectErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(err.message));
  return errors;
}

test("page loads without JS errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await page.waitForTimeout(3000);
  const real = errors.filter(e =>
    !e.includes("Content Security Policy") &&
    !e.includes("favicon") &&
    !e.includes("ResizeObserver")
  );
  expect(real, `Console errors:\n${real.join("\n")}`).toHaveLength(0);
});

test("page has correct title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Italy/i);
});

test("Leaflet map container is rendered", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);
  await expect(page.locator(".leaflet-container")).toBeVisible();
});

test("Leaflet tile layer loads (CartoDB tiles requested)", async ({ page }) => {
  const tileRequests: string[] = [];
  page.on("request", req => {
    if (req.url().includes("cartocdn.com")) tileRequests.push(req.url());
  });
  await page.goto("/");
  await page.waitForTimeout(3000);
  expect(tileRequests.length, "No CartoDB tiles — map may be broken").toBeGreaterThan(0);
});

test("4 stay pins are rendered on the map", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);
  await expect(page.locator(".pin-stay")).toHaveCount(4);
});

test("clicking a stay pin opens the location sheet", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);
  await page.locator(".pin-stay").first().click();
  await expect(page.getByRole("link", { name: /open in google maps/i })).toBeVisible();
});

test("location sheet closes on X button click", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);
  await page.locator(".pin-stay").first().click();
  const link = page.getByRole("link", { name: /open in google maps/i });
  await expect(link).toBeVisible();
  await page.getByRole("button", { name: "✕" }).click();
  await expect(link).not.toBeVisible();
});

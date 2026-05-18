/**
 * Desktop-only tests — sidebar is visible, hover interactions work.
 * Only runs on the "chromium" project (Desktop Chrome).
 */
import { test, expect } from "@playwright/test";

test("sidebar shows trip title and dates", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Italy" })).toBeVisible();
  await expect(page.getByText(/Jul 22 – Aug 6/).first()).toBeVisible();
  await expect(page.getByText(/Rahul & Dhrumi/).first()).toBeVisible();
});

test("sidebar shows confirmed booking count", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/4\/\d+ confirmed/)).toBeVisible();
});

test("timeline shows all major destinations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("NYC → Milan")).toBeVisible();
  await expect(page.getByText("Lake Maggiore")).toBeVisible();
  await expect(page.getByText("Tuscany", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Puglia", { exact: true })).toBeVisible();
  await expect(page.getByText("Sardinia", { exact: true })).toBeVisible();
});

test("clicking a timeline row expands it and shows leg details", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button").filter({ hasText: "CAG → Paris → NYC" }).click();
  await page.waitForTimeout(350);
  await expect(page.getByText("XDQETZ").first()).toBeVisible();
  await expect(page.getByText(/AF1111/)).toBeVisible();
});

test("expanded Italo train row shows confirmation CCDUHP", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button").filter({ hasText: "Milan → Florence → Tuscany" }).click();
  await page.waitForTimeout(350);
  await expect(page.getByText("CCDUHP")).toBeVisible();
});

test("expanding and collapsing a row works", async ({ page }) => {
  await page.goto("/");
  const rowButton = page.getByRole("button").filter({ hasText: "CAG → Paris → NYC" });
  await rowButton.click();
  await page.waitForTimeout(350);
  await expect(page.getByText("XDQETZ").first()).toBeVisible();
  await rowButton.click();
  await page.waitForTimeout(350);
  await expect(page.getByText("XDQETZ").first()).not.toBeVisible();
});

test("theme switcher has 3 buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Amalfi" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Capri" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Notte" })).toBeVisible();
});

test("switching to Capri theme sets theme-capri class", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Capri" }).click();
  await expect(page.locator("div.theme-capri")).toBeAttached();
});

test("switching to Notte theme sets theme-notte class", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Notte" }).click();
  await expect(page.locator("div.theme-notte")).toBeAttached();
});

test("hovering a stay card shows Google Maps hover card", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Regina Palace Hotel")).toBeVisible();
  await page.getByText("Regina Palace Hotel").hover();
  await page.waitForTimeout(500);
  await expect(page.getByRole("link", { name: /See reviews & photos/i })).toBeVisible();
});

test("hover card Google Maps link is correct", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Regina Palace Hotel").hover();
  await page.waitForTimeout(500);
  const link = page.getByRole("link", { name: /See reviews & photos/i });
  const href = await link.getAttribute("href");
  expect(href).toContain("google.com/maps");
  await expect(link).toHaveAttribute("target", "_blank");
});

test("hover card disappears after mouse leaves", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Regina Palace Hotel").hover();
  await page.waitForTimeout(500);
  await expect(page.getByRole("link", { name: /See reviews & photos/i })).toBeVisible();
  await page.locator(".leaflet-container").hover();
  await page.waitForTimeout(400);
  await expect(page.getByRole("link", { name: /See reviews & photos/i })).not.toBeVisible();
});

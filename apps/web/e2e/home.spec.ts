import { expect, test } from "@playwright/test";

test.describe("NEZX Academy landing page", () => {
  test("renders the hero, courses and enquiry form", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: /turn your skills/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Etsy Selling" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Amazon.in Selling" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tell us what you want to sell." })).toBeVisible();
    await expect(page.getByRole("link", { name: /chat on whatsapp/i })).toBeVisible();
  });

  test("validates the enquiry form before sending", async ({ page }) => {
    await page.goto("/#enquire");

    await page.getByRole("button", { name: /send enquiry/i }).click();

    await expect(page.getByText("Enter your full name.")).toBeVisible();
    await expect(page.getByText("Enter a valid phone number.")).toBeVisible();
  });

  test("preselects a course from a course card", async ({ page }) => {
    await page.goto("/");

    const card = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Amazon Global Selling" }) });
    await card.getByRole("button", { name: /enquire about this/i }).click();

    await expect(page.locator("#courseSlug")).toHaveValue("amazon-global-selling");
  });

  test("opens and closes a result screenshot in the lightbox", async ({ page }) => {
    await page.goto("/#results");

    await page.getByRole("button", { name: /enlarge: etsy revenue/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /close enlarged image/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("mobile menu navigates to the enquiry form", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile-only behaviour");

    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("link", { name: "Contact" }).click();

    await expect(page.locator("#enquire")).toBeInViewport();
  });

  test("owner route asks for sign-in", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /owner sign-in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});

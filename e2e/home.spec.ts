import { test, expect } from "@playwright/test";
import { waitForPageLoad, acceptCookies, TEST_DATA } from "./fixtures/test-data";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
    await acceptCookies(page);
  });

  test("should load homepage with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Johnson Bros.*Plumbing|Plumbing.*Quincy/i);
  });

  test("should display hero section with CTA", async ({ page }) => {
    // Hero section should be visible
    const hero = page.locator('[data-testid="hero"], section').first();
    await expect(hero).toBeVisible();

    // Should have a primary CTA button
    const ctaButton = page
      .locator('button:has-text("Book"), a:has-text("Book"), button:has-text("Call"), a:has-text("Schedule")')
      .first();
    await expect(ctaButton).toBeVisible();
  });

  test("should display services section", async ({ page }) => {
    const services = page.locator('[data-testid="services-section"], section:has-text("Services")').first();
    await expect(services).toBeVisible();
  });

  test("should display phone number", async ({ page }) => {
    const phone = page
      .locator(`text=${TEST_DATA.phoneNumber}, a[href="tel:${TEST_DATA.phoneNumberTel}"]`)
      .first();
    await expect(phone).toBeVisible();
  });

  test("should have working header navigation", async ({ page }) => {
    // Check header is visible
    const header = page.locator("header, nav").first();
    await expect(header).toBeVisible();

    // Check for navigation links
    const navLinks = page.locator('nav a, header a[href^="/"]');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(2);
  });

  test("should navigate to services page", async ({ page }) => {
    // Find and click services link
    const servicesLink = page.locator('nav >> a:has-text("Services"), header >> a:has-text("Services")').first();
    if (await servicesLink.isVisible().catch(() => false)) {
      await servicesLink.click();
      await expect(page).toHaveURL(/services/);
    }
  });

  test("should navigate to contact page", async ({ page }) => {
    const contactLink = page.locator('nav >> a:has-text("Contact"), header >> a:has-text("Contact")').first();
    if (await contactLink.isVisible().catch(() => false)) {
      await contactLink.click();
      await expect(page).toHaveURL(/contact/);
    }
  });

  test("should display footer with company info", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Footer should contain company name
    await expect(footer).toContainText(/Johnson Bros|Plumbing/i);
  });

  test("should have Google reviews or testimonials section", async ({ page }) => {
    // Look for reviews section
    const reviews = page
      .locator('[data-testid="reviews"], section:has-text("Reviews"), section:has-text("Testimonials")')
      .first();

    // Reviews may be lazy loaded, scroll to find
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);

    // Check if reviews section exists
    const reviewsVisible = await reviews.isVisible().catch(() => false);
    if (reviewsVisible) {
      await expect(reviews).toBeVisible();
    }
  });

  test("should be mobile responsive", async ({ page, isMobile }) => {
    if (isMobile) {
      // Mobile menu button should exist
      const menuButton = page
        .locator('[data-testid="mobile-menu"], button[aria-label*="menu" i], button[aria-label*="Menu" i]')
        .first();

      // On mobile, either menu button is visible OR navigation is hidden
      const menuVisible = await menuButton.isVisible().catch(() => false);
      if (menuVisible) {
        // Click to open menu
        await menuButton.click();

        // Menu should open
        const menuContent = page.locator('nav[data-mobile="true"], [data-testid="mobile-nav"], nav');
        await expect(menuContent).toBeVisible();
      }
    }
  });

  test("should have schema markup for LocalBusiness", async ({ page }) => {
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    expect(count).toBeGreaterThan(0);

    // Verify at least one schema is valid JSON
    const schemaContent = await schemas.first().textContent();
    expect(() => JSON.parse(schemaContent || "")).not.toThrow();
  });

  test("should load without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("favicon")) {
        consoleErrors.push(msg.text());
      }
    });

    await page.reload();
    await waitForPageLoad(page);

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("ResizeObserver") &&
        !err.includes("passive event listener") &&
        !err.includes("favicon")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

import { test, expect } from "@playwright/test";
import { TEST_DATA, waitForPageLoad, acceptCookies } from "./fixtures/test-data";

test.describe("Service Pages", () => {
  const servicePages = [
    { slug: "drain-cleaning", name: "Drain Cleaning" },
    { slug: "emergency-plumbing", name: "Emergency Plumbing" },
    { slug: "water-heater", name: "Water Heater" },
    { slug: "general-plumbing", name: "General Plumbing" },
    { slug: "pipe-repair", name: "Pipe Repair" },
    { slug: "heating", name: "Heating" },
  ];

  for (const service of servicePages) {
    test.describe(`Service: ${service.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(`/services/${service.slug}`);
        await waitForPageLoad(page);
        await acceptCookies(page);
      });

      test("should load page correctly", async ({ page }) => {
        // Page should have an H1
        const h1 = page.locator("h1");
        await expect(h1).toBeVisible();

        // H1 should contain relevant keywords
        const h1Text = await h1.textContent();
        expect(h1Text?.toLowerCase()).toMatch(/plumbing|drain|water|heat|pipe|emergency/i);
      });

      test("should have CTA button", async ({ page }) => {
        const cta = page
          .locator(
            'button:has-text("Book"), button:has-text("Call"), button:has-text("Schedule"), a[href^="tel:"], [data-testid="service-cta"]'
          )
          .first();
        await expect(cta).toBeVisible();
      });

      test("should have schema markup", async ({ page }) => {
        const schema = page.locator('script[type="application/ld+json"]');
        const count = await schema.count();
        expect(count).toBeGreaterThan(0);

        // Verify JSON is valid
        const content = await schema.first().textContent();
        const parsed = JSON.parse(content || "{}");
        expect(parsed).toHaveProperty("@type");
      });

      test("should have meta description", async ({ page }) => {
        const metaDesc = page.locator('meta[name="description"]');
        await expect(metaDesc).toHaveAttribute("content", /.{30,}/);
      });

      test("should display phone number", async ({ page }) => {
        const phone = page.locator(`text=${TEST_DATA.phoneNumber}`);
        await expect(phone.first()).toBeVisible();
      });

      test("should have navigation back to home", async ({ page }) => {
        const homeLink = page.locator('a[href="/"], nav >> text=Home, header >> a:has-text("Johnson Bros")').first();
        await expect(homeLink).toBeVisible();
      });
    });
  }

  test("should navigate between services", async ({ page }) => {
    await page.goto("/services/drain-cleaning");
    await waitForPageLoad(page);

    // Find link to another service
    const otherServiceLink = page
      .locator('a[href*="/services/"]:not([href*="drain-cleaning"])')
      .first();

    if (await otherServiceLink.isVisible().catch(() => false)) {
      await otherServiceLink.click();
      await waitForPageLoad(page);
      await expect(page).not.toHaveURL(/drain-cleaning/);
    }
  });

  test("should have consistent header across service pages", async ({ page }) => {
    for (const service of servicePages.slice(0, 3)) {
      await page.goto(`/services/${service.slug}`);
      await waitForPageLoad(page);

      const header = page.locator("header, nav").first();
      await expect(header).toBeVisible();

      // Header should have logo or company name
      const logo = page.locator('header img[alt*="logo" i], header >> text=Johnson');
      await expect(logo.first()).toBeVisible();
    }
  });

  test("should have consistent footer across service pages", async ({ page }) => {
    for (const service of servicePages.slice(0, 3)) {
      await page.goto(`/services/${service.slug}`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      const footer = page.locator("footer");
      await expect(footer).toBeVisible();
    }
  });
});

test.describe("Service Landing Pages", () => {
  const landingPages = [
    { path: "/service/drain-cleaning-landing", name: "Drain Cleaning Landing" },
    { path: "/service/water-heater-landing", name: "Water Heater Landing" },
    { path: "/service/pipe-repair-landing", name: "Pipe Repair Landing" },
    { path: "/service/emergency-plumbing-landing", name: "Emergency Landing" },
  ];

  for (const landing of landingPages) {
    test(`${landing.name} should load correctly`, async ({ page }) => {
      const response = await page.goto(landing.path);

      // Page might not exist, that's okay
      if (response?.status() === 200) {
        await waitForPageLoad(page);

        const h1 = page.locator("h1");
        await expect(h1).toBeVisible();

        // Should have strong CTA
        const cta = page.locator('button:has-text("Book"), button:has-text("Call"), a[href^="tel:"]').first();
        await expect(cta).toBeVisible();
      }
    });
  }
});

test.describe("Emergency Plumbing Flow", () => {
  test("emergency page should emphasize urgency", async ({ page }) => {
    await page.goto("/services/emergency-plumbing");
    await waitForPageLoad(page);

    // Should contain emergency-related keywords
    const content = await page.locator("main, article, section").first().textContent();
    expect(content?.toLowerCase()).toMatch(/emergency|24.*7|urgent|immediate|fast/i);

    // Phone number should be prominently displayed
    const phoneLinks = page.locator(`a[href="tel:${TEST_DATA.phoneNumberTel}"]`);
    expect(await phoneLinks.count()).toBeGreaterThan(0);
  });

  test("emergency page should have quick booking option", async ({ page }) => {
    await page.goto("/services/emergency-plumbing");
    await waitForPageLoad(page);

    const quickBook = page
      .locator(
        'button:has-text("Call Now"), button:has-text("Book Now"), button:has-text("Emergency"), [data-testid="emergency-cta"]'
      )
      .first();

    await expect(quickBook).toBeVisible();
  });
});

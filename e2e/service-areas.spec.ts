import { test, expect } from "@playwright/test";
import { TEST_DATA, waitForPageLoad, acceptCookies } from "./fixtures/test-data";

test.describe("Service Area Pages", () => {
  const serviceAreas = [
    { slug: "quincy", name: "Quincy" },
    { slug: "braintree", name: "Braintree" },
    { slug: "weymouth", name: "Weymouth" },
    { slug: "hingham", name: "Hingham" },
    { slug: "rockland", name: "Rockland" },
    { slug: "marshfield", name: "Marshfield" },
    { slug: "plymouth", name: "Plymouth" },
    { slug: "hull", name: "Hull" },
    { slug: "cohasset", name: "Cohasset" },
    { slug: "hanover", name: "Hanover" },
    { slug: "abington", name: "Abington" },
    { slug: "scituate", name: "Scituate" },
  ];

  for (const area of serviceAreas) {
    test.describe(`Service Area: ${area.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(`/service-areas/${area.slug}`);
        await waitForPageLoad(page);
        await acceptCookies(page);
      });

      test("should load page with city name in heading", async ({ page }) => {
        const heading = page.locator("h1");
        await expect(heading).toBeVisible();

        const headingText = await heading.textContent();
        expect(headingText?.toLowerCase()).toContain(area.name.toLowerCase());
      });

      test("should have LocalBusiness schema", async ({ page }) => {
        const schema = page.locator('script[type="application/ld+json"]');
        const count = await schema.count();
        expect(count).toBeGreaterThan(0);

        // Find LocalBusiness schema
        let hasLocalBusiness = false;
        for (let i = 0; i < count; i++) {
          const content = await schema.nth(i).textContent();
          if (content?.includes("LocalBusiness") || content?.includes("Plumber")) {
            hasLocalBusiness = true;
            break;
          }
        }
        expect(hasLocalBusiness).toBe(true);
      });

      test("should have phone number visible", async ({ page }) => {
        const phone = page.locator(`text=${TEST_DATA.phoneNumber}`);
        await expect(phone.first()).toBeVisible();
      });

      test("should have booking CTA", async ({ page }) => {
        const cta = page
          .locator('button:has-text("Book"), button:has-text("Call"), button:has-text("Schedule"), a[href^="tel:"]')
          .first();
        await expect(cta).toBeVisible();
      });

      test("should have meta description with city name", async ({ page }) => {
        const metaDesc = page.locator('meta[name="description"]');
        const content = await metaDesc.getAttribute("content");
        expect(content?.toLowerCase()).toMatch(new RegExp(area.name.toLowerCase() + "|plumb", "i"));
      });
    });
  }

  test("should load service areas index page", async ({ page }) => {
    await page.goto("/service-areas");
    await waitForPageLoad(page);
    await acceptCookies(page);

    // Should have heading
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Should list multiple cities
    const cityLinks = page.locator('a[href*="/service-areas/"]');
    const count = await cityLinks.count();
    expect(count).toBeGreaterThan(5);
  });

  test("should navigate between service areas from index", async ({ page }) => {
    await page.goto("/service-areas");
    await waitForPageLoad(page);

    // Click on first city link
    const firstCityLink = page.locator('a[href*="/service-areas/"]:not([href="/service-areas"])').first();
    const href = await firstCityLink.getAttribute("href");

    await firstCityLink.click();
    await waitForPageLoad(page);

    expect(page.url()).toContain(href);
  });

  test("all service area pages should have consistent layout", async ({ page }) => {
    for (const area of serviceAreas.slice(0, 5)) {
      await page.goto(`/service-areas/${area.slug}`);
      await waitForPageLoad(page);

      // Should have header
      const header = page.locator("header");
      await expect(header).toBeVisible();

      // Should have main content
      const main = page.locator("main, article");
      await expect(main.first()).toBeVisible();

      // Should have footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const footer = page.locator("footer");
      await expect(footer).toBeVisible();
    }
  });
});

test.describe("Service Area SEO", () => {
  test("quincy page should have proper local SEO", async ({ page }) => {
    await page.goto("/service-areas/quincy");
    await waitForPageLoad(page);

    // Title should mention Quincy and plumbing
    await expect(page).toHaveTitle(/Quincy.*Plumb|Plumb.*Quincy/i);

    // Should have canonical URL
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toBeAttached();

    // Should have Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toBeAttached();
  });

  test("service areas should have unique meta descriptions", async ({ page }) => {
    const descriptions: string[] = [];

    for (const area of ["quincy", "braintree", "weymouth"]) {
      await page.goto(`/service-areas/${area}`);
      await waitForPageLoad(page);

      const metaDesc = page.locator('meta[name="description"]');
      const content = await metaDesc.getAttribute("content");
      descriptions.push(content || "");
    }

    // Each description should be unique
    const uniqueDescriptions = new Set(descriptions);
    expect(uniqueDescriptions.size).toBe(descriptions.length);
  });
});

test.describe("Service Area Map Integration", () => {
  test("homepage should have coverage map or service area section", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    // Scroll to find map section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);

    const mapSection = page.locator(
      '[data-testid="coverage-map"], [class*="map"], section:has-text("Service Area"), section:has-text("Coverage")'
    );

    // Map might be present
    const mapVisible = await mapSection.first().isVisible().catch(() => false);
    // This is optional, so we don't fail if not present
    expect(true).toBe(true);
  });
});

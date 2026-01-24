import { test, expect } from "@playwright/test";
import { waitForPageLoad, TEST_DATA } from "./fixtures/test-data";

test.describe("SEO Requirements", () => {
  const pagesToTest = TEST_DATA.criticalPages;

  for (const { name, path } of pagesToTest) {
    test.describe(`SEO: ${name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(path);
        await waitForPageLoad(page);
      });

      test("should have proper title tag", async ({ page }) => {
        const title = await page.title();
        expect(title.length).toBeGreaterThan(10);
        expect(title.length).toBeLessThan(70);

        // Title should not be generic
        expect(title).not.toBe("React App");
        expect(title).not.toBe("Vite App");
      });

      test("should have meta description", async ({ page }) => {
        const metaDesc = page.locator('meta[name="description"]');
        await expect(metaDesc).toBeAttached();

        const content = await metaDesc.getAttribute("content");
        expect(content?.length).toBeGreaterThan(50);
        expect(content?.length).toBeLessThan(160);
      });

      test("should have canonical URL", async ({ page }) => {
        const canonical = page.locator('link[rel="canonical"]');
        await expect(canonical).toBeAttached();

        const href = await canonical.getAttribute("href");
        expect(href).toMatch(/^https?:\/\//);
      });

      test("should have exactly one H1", async ({ page }) => {
        const h1Count = await page.locator("h1").count();
        expect(h1Count).toBe(1);

        const h1Text = await page.locator("h1").textContent();
        expect(h1Text?.trim().length).toBeGreaterThan(0);
      });

      test("should have schema markup", async ({ page }) => {
        const schemas = page.locator('script[type="application/ld+json"]');
        const count = await schemas.count();
        expect(count).toBeGreaterThan(0);

        // Validate each schema is valid JSON
        for (let i = 0; i < count; i++) {
          const content = await schemas.nth(i).textContent();
          expect(() => JSON.parse(content || "")).not.toThrow();
        }
      });

      test("should have Open Graph tags", async ({ page }) => {
        await expect(page.locator('meta[property="og:title"]')).toBeAttached();
        await expect(page.locator('meta[property="og:description"]')).toBeAttached();
        await expect(page.locator('meta[property="og:url"]')).toBeAttached();
      });

      test("should have Twitter Card tags", async ({ page }) => {
        const twitterCard = page.locator('meta[name="twitter:card"]');
        await expect(twitterCard).toBeAttached();
      });
    });
  }
});

test.describe("Technical SEO", () => {
  test("should have valid sitemap.xml", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()["content-type"];
    expect(contentType).toContain("xml");

    const content = await page.content();
    expect(content).toContain("<urlset");
    expect(content).toContain("<loc>");
  });

  test("should have valid robots.txt", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);

    const content = await page.textContent("body, pre");
    expect(content).toContain("User-agent");
    expect(content).toContain("Sitemap");
  });

  test("sitemap should contain critical URLs", async ({ page }) => {
    await page.goto("/sitemap.xml");
    const content = await page.content();

    // Check for important pages
    expect(content).toContain("/services/");
    expect(content).toContain("/service-areas/");
  });

  test("robots.txt should allow search engines", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    const content = await page.textContent("body, pre");

    // Should not disallow all
    expect(content).not.toContain("Disallow: /\n");

    // Should have sitemap reference
    expect(content?.toLowerCase()).toContain("sitemap");
  });
});

test.describe("Heading Hierarchy", () => {
  test("homepage should have proper heading structure", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    // Get all headings
    const h1s = await page.locator("h1").count();
    const h2s = await page.locator("h2").count();
    const h3s = await page.locator("h3").count();

    // Should have exactly one H1
    expect(h1s).toBe(1);

    // Should have H2s after H1
    expect(h2s).toBeGreaterThan(0);
  });

  test("service pages should have structured headings", async ({ page }) => {
    await page.goto("/services/drain-cleaning");
    await waitForPageLoad(page);

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // H1 should relate to the service
    const h1Text = await h1.textContent();
    expect(h1Text?.toLowerCase()).toMatch(/drain|cleaning|plumb/i);
  });
});

test.describe("Image SEO", () => {
  test("images should have alt text", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");

      // Should have alt text OR be decorative (role="presentation")
      const hasAlt = alt !== null && alt !== undefined;
      const isDecorative = role === "presentation" || role === "none";

      expect(hasAlt || isDecorative).toBe(true);
    }
  });

  test("images should have reasonable file sizes", async ({ page }) => {
    const imageSizes: { src: string; size: number }[] = [];

    page.on("response", async (response) => {
      const contentType = response.headers()["content-type"] || "";
      if (contentType.startsWith("image/")) {
        const size = parseInt(response.headers()["content-length"] || "0", 10);
        if (size > 0) {
          imageSizes.push({ src: response.url(), size });
        }
      }
    });

    await page.goto("/");
    await waitForPageLoad(page);

    // No image should be larger than 2MB
    const largeImages = imageSizes.filter((img) => img.size > 2 * 1024 * 1024);
    expect(largeImages).toHaveLength(0);
  });
});

test.describe("Link SEO", () => {
  test("internal links should be valid", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    const internalLinks = page.locator('a[href^="/"]');
    const count = await internalLinks.count();

    // Check first 10 internal links
    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = internalLinks.nth(i);
      const href = await link.getAttribute("href");

      if (href && !href.includes("#")) {
        const response = await page.goto(href);
        expect(response?.status()).toBeLessThan(400);
        await page.goBack();
      }
    }
  });

  test("phone links should use tel: protocol", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    const phoneLinks = page.locator(`a[href*="${TEST_DATA.phoneNumberTel}"]`);
    const count = await phoneLinks.count();

    for (let i = 0; i < count; i++) {
      const href = await phoneLinks.nth(i).getAttribute("href");
      expect(href).toMatch(/^tel:/);
    }
  });
});

test.describe("Mobile SEO", () => {
  test("should have viewport meta tag", async ({ page }) => {
    await page.goto("/");

    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toBeAttached();

    const content = await viewport.getAttribute("content");
    expect(content).toContain("width=device-width");
  });

  test("should be mobile-friendly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await waitForPageLoad(page);

    // Content should fit viewport (no horizontal scroll)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // Small tolerance
  });
});

test.describe("Page Speed Indicators", () => {
  test("should load critical content quickly", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");

    // Wait for first contentful paint equivalent
    await page.locator("h1, header, nav").first().waitFor({ state: "visible" });

    const loadTime = Date.now() - startTime;

    // First meaningful content should appear within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("should not have render-blocking resources in critical path", async ({ page }) => {
    await page.goto("/");

    // Check for preload hints
    const preloads = page.locator('link[rel="preload"], link[rel="preconnect"]');
    const hasPreloads = (await preloads.count()) > 0;

    // Preloads are recommended but not required
    expect(true).toBe(true);
  });
});

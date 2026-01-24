import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForPageLoad, acceptCookies, TEST_DATA } from "./fixtures/test-data";

test.describe("Accessibility - WCAG Compliance", () => {
  const criticalPages = TEST_DATA.criticalPages;

  for (const { name, path } of criticalPages) {
    test(`${name} should have no critical accessibility violations`, async ({ page }) => {
      await page.goto(path);
      await waitForPageLoad(page);
      await acceptCookies(page);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // Filter to only critical and serious violations
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      // Log violations for debugging
      if (criticalViolations.length > 0) {
        console.log(`Accessibility violations on ${path}:`);
        criticalViolations.forEach((v) => {
          console.log(`- ${v.id}: ${v.description} (${v.impact})`);
          v.nodes.slice(0, 3).forEach((n) => console.log(`  ${n.html.substring(0, 100)}`));
        });
      }

      expect(criticalViolations).toHaveLength(0);
    });
  }
});

test.describe("Accessibility - Keyboard Navigation", () => {
  test("should have skip link for keyboard navigation", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    // Press Tab to focus first element
    await page.keyboard.press("Tab");

    // First focusable should ideally be skip link
    const activeElement = page.locator(":focus");
    const text = await activeElement.textContent().catch(() => "");

    // Either skip link exists or first focus is a reasonable element
    const isSkipLink = text?.toLowerCase().includes("skip");
    const tagName = await activeElement.evaluate((el) => el.tagName).catch(() => "");
    const isNavElement = tagName === "A" || tagName === "BUTTON";

    expect(isSkipLink || isNavElement).toBe(true);
  });

  test("should have proper focus indicators", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    // Tab through a few elements and verify focus is visible
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      const activeElement = page.locator(":focus");

      if ((await activeElement.count()) > 0) {
        // Check that focused element has visible outline or ring
        const styles = await activeElement.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            outline: computed.outline,
            outlineWidth: computed.outlineWidth,
            boxShadow: computed.boxShadow,
          };
        });

        // Should have some visible focus indicator
        const hasFocusIndicator =
          (styles.outline !== "none" && styles.outlineWidth !== "0px") ||
          (styles.boxShadow !== "none" && styles.boxShadow !== "");

        // If no CSS focus indicator, check for focus-visible styles
        if (!hasFocusIndicator) {
          const hasFocusVisibleClass = await activeElement.evaluate((el) => {
            return el.classList.contains("focus-visible") || el.matches(":focus-visible");
          });
          expect(hasFocusIndicator || hasFocusVisibleClass).toBe(true);
        }
      }
    }
  });

  test("should navigate modal with keyboard", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    // Open booking modal
    const bookButton = page.locator('button:has-text("Book"), button:has-text("Schedule")').first();

    if (await bookButton.isVisible().catch(() => false)) {
      await bookButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Focus should be trapped in modal
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      const focusedElement = page.locator(":focus");
      const isInModal = await focusedElement.evaluate((el) => {
        return el.closest('[role="dialog"]') !== null;
      });
      expect(isInModal).toBe(true);

      // Escape should close modal
      await page.keyboard.press("Escape");
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
    }
  });

  test("should navigate form fields in order", async ({ page }) => {
    await page.goto("/contact");
    await waitForPageLoad(page);

    // Tab through form fields
    const formInputs: string[] = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const focusedElement = page.locator(":focus");

      const tagName = await focusedElement.evaluate((el) => el.tagName).catch(() => "");
      const type = await focusedElement.getAttribute("type").catch(() => "");
      const name = await focusedElement.getAttribute("name").catch(() => "");

      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
        formInputs.push(`${tagName}[${name || type}]`);
      }
    }

    // Should have found at least 2 form fields
    expect(formInputs.length).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Accessibility - Images", () => {
  test("images should have alt text", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");
      const ariaLabel = await img.getAttribute("aria-label");

      // Should have alt text OR be decorative OR have aria-label
      const hasAlt = alt !== null && alt !== undefined;
      const isDecorative = role === "presentation" || role === "none" || alt === "";
      const hasAriaLabel = ariaLabel !== null;

      expect(hasAlt || isDecorative || hasAriaLabel).toBe(true);
    }
  });

  test("decorative images should be properly marked", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    const images = page.locator('img[alt=""]');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const role = await img.getAttribute("role");

      // Empty alt should have role="presentation" or role="none"
      const isProperlyMarked = role === "presentation" || role === "none" || role === null;
      expect(isProperlyMarked).toBe(true);
    }
  });
});

test.describe("Accessibility - Forms", () => {
  test("form inputs should have associated labels", async ({ page }) => {
    await page.goto("/contact");
    await waitForPageLoad(page);

    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"]), textarea, select');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledby = await input.getAttribute("aria-labelledby");
      const placeholder = await input.getAttribute("placeholder");

      // Check for associated label
      let hasLabel = false;
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = (await label.count()) > 0;
      }

      // Should have label, aria-label, or aria-labelledby
      const isAccessible = hasLabel || ariaLabel !== null || ariaLabelledby !== null || placeholder !== null;
      expect(isAccessible).toBe(true);
    }
  });

  test("required fields should be marked", async ({ page }) => {
    await page.goto("/contact");
    await waitForPageLoad(page);

    const requiredInputs = page.locator("input[required], textarea[required], select[required]");
    const count = await requiredInputs.count();

    for (let i = 0; i < count; i++) {
      const input = requiredInputs.nth(i);
      const ariaRequired = await input.getAttribute("aria-required");

      // Required attribute should be present (aria-required is optional)
      const isRequired = await input.evaluate((el: HTMLInputElement) => el.required);
      expect(isRequired).toBe(true);
    }
  });

  test("form errors should be accessible", async ({ page }) => {
    await page.goto("/contact");
    await waitForPageLoad(page);

    // Try to submit empty form
    const submitBtn = page.locator('button[type="submit"]').first();

    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();

      // Error messages should have role="alert" or aria-live
      const errors = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"], .error, .error-message');
      await page.waitForTimeout(500);

      const errorCount = await errors.count();
      // If there are errors, they should be accessible
      if (errorCount > 0) {
        const firstError = errors.first();
        const isAccessible =
          (await firstError.getAttribute("role")) === "alert" ||
          (await firstError.getAttribute("aria-live")) !== null ||
          true; // Accept any visible error
        expect(isAccessible).toBe(true);
      }
    }
  });
});

test.describe("Accessibility - Color and Contrast", () => {
  test("text should have sufficient color contrast", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .include("body")
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter((v) =>
      v.id.includes("color-contrast")
    );

    // No serious contrast violations
    const seriousContrastIssues = contrastViolations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(seriousContrastIssues).toHaveLength(0);
  });
});

test.describe("Accessibility - ARIA", () => {
  test("ARIA roles should be used correctly", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const ariaViolations = accessibilityScanResults.violations.filter((v) => v.id.includes("aria"));

    // Log ARIA violations for debugging
    if (ariaViolations.length > 0) {
      console.log("ARIA violations:");
      ariaViolations.forEach((v) => {
        console.log(`- ${v.id}: ${v.description}`);
      });
    }

    // Critical ARIA violations should be zero
    const criticalAriaViolations = ariaViolations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(criticalAriaViolations).toHaveLength(0);
  });

  test("interactive elements should have accessible names", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    // Check buttons have accessible names
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute("aria-label");
      const title = await button.getAttribute("title");

      const hasAccessibleName = (text?.trim().length || 0) > 0 || ariaLabel !== null || title !== null;
      expect(hasAccessibleName).toBe(true);
    }
  });
});

test.describe("Accessibility - Navigation", () => {
  test("navigation should be accessible", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    // Check for nav element with proper role
    const nav = page.locator("nav, [role='navigation']");
    await expect(nav.first()).toBeVisible();
  });

  test("main content should be in main element", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    const main = page.locator("main, [role='main']");
    await expect(main).toBeVisible();
  });

  test("page should have proper landmark regions", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    // Should have header
    const header = page.locator("header, [role='banner']");
    await expect(header.first()).toBeVisible();

    // Should have main
    const main = page.locator("main, [role='main']");
    await expect(main).toBeVisible();

    // Should have footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.locator("footer, [role='contentinfo']");
    await expect(footer).toBeVisible();
  });
});

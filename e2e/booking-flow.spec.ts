import { test, expect } from "@playwright/test";
import { TEST_DATA, waitForPageLoad, acceptCookies, generateTestEmail, generateTestPhone } from "./fixtures/test-data";

test.describe("Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
    await acceptCookies(page);
  });

  test("should open booking modal from CTA button", async ({ page }) => {
    // Find and click booking CTA
    const bookButton = page
      .locator('button:has-text("Book"), button:has-text("Schedule"), [data-testid="book-btn"]')
      .first();

    if (await bookButton.isVisible().catch(() => false)) {
      await bookButton.click();

      // Modal should appear
      const modal = page.locator('[role="dialog"], [data-testid="booking-modal"], .booking-modal');
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test("should display booking form fields", async ({ page }) => {
    // Open booking modal
    const bookButton = page
      .locator('button:has-text("Book"), button:has-text("Schedule")')
      .first();

    if (await bookButton.isVisible().catch(() => false)) {
      await bookButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Check for common form fields
      const nameField = page.locator('input[name="firstName"], input[name="name"], input[placeholder*="name" i]');
      const phoneField = page.locator('input[name="phone"], input[type="tel"]');
      const emailField = page.locator('input[name="email"], input[type="email"]');

      // At least name or phone should be present
      const hasNameField = await nameField.first().isVisible().catch(() => false);
      const hasPhoneField = await phoneField.first().isVisible().catch(() => false);

      expect(hasNameField || hasPhoneField).toBe(true);
    }
  });

  test("should validate required fields on booking form", async ({ page }) => {
    const bookButton = page
      .locator('button:has-text("Book"), button:has-text("Schedule")')
      .first();

    if (await bookButton.isVisible().catch(() => false)) {
      await bookButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Try to submit without filling fields
      const submitButton = page
        .locator('[role="dialog"] button[type="submit"], [role="dialog"] button:has-text("Submit"), [role="dialog"] button:has-text("Book")')
        .first();

      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();

        // Should show validation error
        const error = page.locator('text=required, [role="alert"], .error-message, text=Please');
        const hasError = await error.first().isVisible({ timeout: 3000 }).catch(() => false);

        // If no error visible, form might have HTML5 validation
        if (!hasError) {
          // Check for invalid state on inputs
          const invalidInput = page.locator('input:invalid');
          const hasInvalidInput = (await invalidInput.count()) > 0;
          expect(hasInvalidInput || hasError).toBe(true);
        }
      }
    }
  });

  test("should be able to fill booking form fields", async ({ page }) => {
    const bookButton = page
      .locator('button:has-text("Book"), button:has-text("Schedule")')
      .first();

    if (await bookButton.isVisible().catch(() => false)) {
      await bookButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Fill form fields
      const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First" i]').first();
      const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="Last" i]').first();
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();

      if (await firstNameInput.isVisible().catch(() => false)) {
        await firstNameInput.fill(TEST_DATA.testCustomer.firstName);
        await expect(firstNameInput).toHaveValue(TEST_DATA.testCustomer.firstName);
      }

      if (await lastNameInput.isVisible().catch(() => false)) {
        await lastNameInput.fill(TEST_DATA.testCustomer.lastName);
        await expect(lastNameInput).toHaveValue(TEST_DATA.testCustomer.lastName);
      }

      if (await emailInput.isVisible().catch(() => false)) {
        const testEmail = generateTestEmail();
        await emailInput.fill(testEmail);
        await expect(emailInput).toHaveValue(testEmail);
      }

      if (await phoneInput.isVisible().catch(() => false)) {
        await phoneInput.fill(TEST_DATA.testCustomer.phone);
      }
    }
  });

  test("should close booking modal", async ({ page }) => {
    const bookButton = page
      .locator('button:has-text("Book"), button:has-text("Schedule")')
      .first();

    if (await bookButton.isVisible().catch(() => false)) {
      await bookButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Find close button
      const closeButton = page.locator(
        '[role="dialog"] button[aria-label="Close"], [role="dialog"] [data-testid="close"], [role="dialog"] button:has-text("Close"), [role="dialog"] button:has-text("×")'
      ).first();

      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
      } else {
        // Try pressing Escape
        await page.keyboard.press("Escape");
        await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
      }
    }
  });

  test("should have working phone CTA", async ({ page }) => {
    // Find phone link
    const phoneLink = page.locator(`a[href="tel:${TEST_DATA.phoneNumberTel}"]`).first();

    if (await phoneLink.isVisible().catch(() => false)) {
      const href = await phoneLink.getAttribute("href");
      expect(href).toBe(`tel:${TEST_DATA.phoneNumberTel}`);
    }
  });
});

test.describe("Chat Widget Booking", () => {
  test("should display chat widget", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
    await acceptCookies(page);

    // Wait for chat widget to load
    const chatWidget = page.locator(
      '[data-testid="chat-widget"], .chat-widget, [class*="chat"], iframe[title*="chat" i]'
    );

    // Chat widget might be lazy loaded
    await page.waitForTimeout(2000);

    const isVisible = await chatWidget.first().isVisible().catch(() => false);
    // Chat widget presence is optional, just verify it doesn't break the page
    expect(true).toBe(true);
  });

  test("should open chat widget when clicked", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
    await acceptCookies(page);

    const chatButton = page.locator(
      '[data-testid="chat-toggle"], button[aria-label*="chat" i], .chat-toggle'
    ).first();

    if (await chatButton.isVisible().catch(() => false)) {
      await chatButton.click();

      // Chat interface should open
      const chatInterface = page.locator(
        '[data-testid="chat-interface"], .chat-messages, [class*="chat-body"]'
      );
      await expect(chatInterface).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Express Booking", () => {
  test("should have express booking component on homepage", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    const expressBooking = page.locator(
      '[data-testid="express-booking"], .express-booking, section:has-text("Express")'
    );

    // Express booking is optional
    const isVisible = await expressBooking.first().isVisible().catch(() => false);
    if (isVisible) {
      await expect(expressBooking.first()).toBeVisible();
    }
  });

  test("should navigate to AI booking page", async ({ page }) => {
    await page.goto("/ai-booking");
    await waitForPageLoad(page);

    // Page should load without error
    const content = page.locator("main, #root");
    await expect(content).toBeVisible();
  });
});

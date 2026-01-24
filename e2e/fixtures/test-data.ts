import { Page } from "@playwright/test";

/**
 * Test data and utilities for E2E tests
 */

export const TEST_DATA = {
  // Valid service areas from the codebase
  serviceAreas: ["quincy", "braintree", "weymouth", "hingham", "rockland", "marshfield"],

  // Services available
  services: ["drain-cleaning", "emergency-plumbing", "water-heater", "general-plumbing", "pipe-repair", "heating"],

  // Test customer data (use for form submissions in test env)
  testCustomer: {
    firstName: "Test",
    lastName: "Customer",
    email: "test@example.com",
    phone: "617-555-0100",
    address: "123 Test St, Quincy, MA 02169",
  },

  // Admin credentials (test environment only)
  testAdmin: {
    email: process.env.TEST_ADMIN_EMAIL || "test@admin.com",
    password: process.env.TEST_ADMIN_PASSWORD || "testpassword123",
  },

  // Phone number displayed on site
  phoneNumber: "617-479-9911",
  phoneNumberTel: "6174799911",

  // Company name
  companyName: "Johnson Bros",

  // Critical pages for testing
  criticalPages: [
    { name: "Homepage", path: "/" },
    { name: "Contact", path: "/contact" },
    { name: "About", path: "/about" },
    { name: "Service - Drain Cleaning", path: "/services/drain-cleaning" },
    { name: "Service - Emergency Plumbing", path: "/services/emergency-plumbing" },
    { name: "Service Area - Quincy", path: "/service-areas/quincy" },
    { name: "Service Areas Index", path: "/service-areas" },
  ],
};

/**
 * Wait for page to be fully loaded (network idle)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

/**
 * Accept cookie consent banner if visible
 */
export async function acceptCookies(page: Page): Promise<void> {
  try {
    const banner = page.locator('[data-testid="cookie-consent"], [class*="cookie"], [id*="cookie"]');
    if (await banner.isVisible({ timeout: 2000 })) {
      const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("OK"), button:has-text("Got it")');
      if (await acceptBtn.isVisible({ timeout: 1000 })) {
        await acceptBtn.click();
      }
    }
  } catch {
    // No cookie banner, continue
  }
}

/**
 * Close any modal that might be open
 */
export async function closeModals(page: Page): Promise<void> {
  try {
    const closeBtn = page.locator('[data-testid="modal-close"], button[aria-label="Close"], button:has-text("Close")').first();
    if (await closeBtn.isVisible({ timeout: 1000 })) {
      await closeBtn.click();
    }
  } catch {
    // No modal, continue
  }
}

/**
 * Check if page has loaded without errors
 */
export async function checkPageLoaded(page: Page): Promise<boolean> {
  // Check for React error boundary
  const errorBoundary = page.locator('[data-testid="error-boundary"], text=Something went wrong');
  if (await errorBoundary.isVisible({ timeout: 500 }).catch(() => false)) {
    return false;
  }

  // Check for 404 page
  const notFound = page.locator('text=Page not found, text=404');
  if (await notFound.isVisible({ timeout: 500 }).catch(() => false)) {
    return false;
  }

  return true;
}

/**
 * Generate random email for testing
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  return `test+${timestamp}@example.com`;
}

/**
 * Generate random phone for testing
 */
export function generateTestPhone(): string {
  const num = Math.floor(Math.random() * 9000000) + 1000000;
  return `617-${num.toString().substring(0, 3)}-${num.toString().substring(3, 7)}`;
}

/**
 * Wait for API response
 */
export async function waitForAPI(page: Page, urlPattern: string | RegExp): Promise<void> {
  await page.waitForResponse(
    (response) =>
      (typeof urlPattern === "string"
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) &&
      response.status() === 200,
    { timeout: 10000 }
  );
}

/**
 * Scroll to element and ensure it's in viewport
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500); // Allow animations to complete
}

/**
 * Take screenshot with timestamp
 */
export async function takeDebugScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({ path: `playwright-report/debug-${name}-${timestamp}.png`, fullPage: true });
}

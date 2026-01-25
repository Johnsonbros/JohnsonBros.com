import { chromium, FullConfig } from "@playwright/test";

/**
 * Global setup for E2E tests
 * Waits for the server to be ready before running tests
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:5000";

  console.log(`Waiting for server at ${baseURL}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Retry health check with exponential backoff
  let retries = 30;
  let delay = 1000;

  while (retries > 0) {
    try {
      const response = await page.goto(`${baseURL}/health`, {
        timeout: 5000,
        waitUntil: "domcontentloaded",
      });

      if (response?.ok()) {
        console.log("Server is ready!");
        await browser.close();
        return;
      }
    } catch (error) {
      // Server not ready yet, will retry
    }

    retries--;

    if (retries > 0) {
      console.log(`Server not ready, retrying in ${delay}ms... (${retries} attempts remaining)`);
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.5, 5000); // Cap at 5 seconds
    }
  }

  await browser.close();

  // If we get here, server didn't start
  // Don't throw error if reuseExistingServer is true and we're in dev
  if (config.webServer?.reuseExistingServer) {
    console.warn(
      "Warning: Could not verify server is running. Tests may fail if server is not started."
    );
    return;
  }

  throw new Error(`Server failed to start at ${baseURL} after 30 retries`);
}

export default globalSetup;

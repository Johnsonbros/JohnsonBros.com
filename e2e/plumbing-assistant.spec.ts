import { test, expect } from "@playwright/test";

test("books an appointment via the chat widget", async ({ page }) => {
  await page.route("**/api/v1/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        sessionId: "e2e-session",
        message: "You're booked!",
        toolsUsed: ["book_service_call"],
        toolResults: [
          {
            tool: "book_service_call",
            result: {
              scheduledDate: "2024-06-20",
              serviceName: "Drain Cleaning",
              address: "123 Main St",
              jobId: "JB-200",
            },
          },
        ],
      }),
    });
  });

  await page.goto("/openai-app");

  await expect(page.getByText("Johnson Bros. Plumbing")).toBeVisible();
  await page.getByTestId("app-input").fill("Book an appointment");
  await page.getByTestId("app-send-button").click();

  await expect(page.getByText("Appointment Confirmed")).toBeVisible();
  await expect(page.getByText("Drain Cleaning")).toBeVisible();
});

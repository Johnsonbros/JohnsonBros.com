import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlumbingAssistantApp } from "./PlumbingAssistantApp";

const mockFetch = vi.fn();

describe("PlumbingAssistantApp", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as typeof fetch;
  });

  it("renders appointment cards from tool responses", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        sessionId: "session-1",
        message: "You're all set!",
        toolsUsed: ["book_service_call"],
        toolResults: [
          {
            tool: "book_service_call",
            result: {
              scheduledDate: "2024-06-20",
              serviceName: "Drain Cleaning",
              address: "123 Main St",
              jobId: "JB-100",
            },
          },
        ],
      }),
    });

    render(<PlumbingAssistantApp />);

    await userEvent.type(screen.getByTestId("app-input"), "Book an appointment");
    await userEvent.click(screen.getByTestId("app-send-button"));

    expect(mockFetch).toHaveBeenCalled();
    expect(await screen.findByText("Appointment Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Drain Cleaning")).toBeInTheDocument();
  });

  it("renders quote cards when quote tools are used", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        sessionId: "session-2",
        message: "Drain cleaning typically costs $199.",
        toolsUsed: ["get_quote"],
      }),
    });

    render(<PlumbingAssistantApp />);

    await userEvent.type(screen.getByTestId("app-input"), "Need a quote");
    await userEvent.click(screen.getByTestId("app-send-button"));

    expect(await screen.findByText("Service Quote")).toBeInTheDocument();
    expect(screen.getByText("$199")).toBeInTheDocument();
  });

  it("renders emergency cards for emergency tool usage", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        sessionId: "session-3",
        message: "Call us immediately.",
        toolsUsed: ["emergency_help"],
      }),
    });

    render(<PlumbingAssistantApp />);

    await userEvent.type(screen.getByTestId("app-input"), "Emergency!");
    await userEvent.click(screen.getByTestId("app-send-button"));

    expect(await screen.findByText("Emergency? Call Us Now")).toBeInTheDocument();
  });
});

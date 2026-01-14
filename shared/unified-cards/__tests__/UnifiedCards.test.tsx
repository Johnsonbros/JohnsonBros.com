import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeadCaptureCard } from "../LeadCaptureCard";
import { DatePickerCard } from "../DatePickerCard";
import { TimePickerCard } from "../TimePickerCard";
import { AppointmentConfirmationCard } from "../AppointmentConfirmationCard";
import { QuoteCard } from "../QuoteCard";
import { EmergencyInstructionsCard } from "../EmergencyInstructionsCard";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("unified cards", () => {
  it("submits lead capture details", async () => {
    const onSubmit = vi.fn();
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <LeadCaptureCard
        payload={{ title: "Share your info", message: "We will follow up." }}
        onSubmit={onSubmit}
        onDismiss={onDismiss}
      />,
    );

    await user.type(screen.getByLabelText("Your Name"), "Jamie Doe");
    await user.type(screen.getByLabelText("Phone Number"), "6175551234");
    await user.type(screen.getByLabelText("What's the issue?"), "Clogged drain");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Jamie Doe",
      phone: "(617) 555-1234",
      issueDescription: "Clogged drain",
    });

    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("selects an available date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-10T12:00:00Z"));
    const onSelectDate = vi.fn();
    const user = userEvent.setup();

    render(
      <DatePickerCard
        payload={{
          title: "Choose a date",
          availableDates: [
            {
              date: "2024-06-10",
              slotsAvailable: 3,
              capacityState: "SAME_DAY_FEE_WAIVED",
            },
          ],
        }}
        onSelectDate={onSelectDate}
      />,
    );

    const todayButton = screen.getByText("Today").closest("button");
    expect(todayButton).toBeTruthy();
    await user.click(todayButton as HTMLButtonElement);

    expect(onSelectDate).toHaveBeenCalledWith("2024-06-10");
    vi.useRealTimers();
  });

  it("selects a time window", async () => {
    const onSelectSlot = vi.fn();
    const user = userEvent.setup();

    render(
      <TimePickerCard
        payload={{
          title: "Pick a time",
          selectedDate: "2024-06-12",
          slots: [
            {
              id: "slot-morning",
              label: "Morning",
              timeWindow: "MORNING",
              available: true,
              technicianCount: 2,
            },
          ],
        }}
        onSelectSlot={onSelectSlot}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Morning/i }));
    expect(onSelectSlot).toHaveBeenCalledWith("slot-morning", "MORNING");
  });

  it("fires appointment confirmation CTA", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <AppointmentConfirmationCard
        payload={{
          title: "You're booked",
          booking: {
            customerName: "Jamie Doe",
            phone: "(617) 555-0101",
            address: "100 Main St",
            serviceType: "Drain Cleaning",
            scheduledDate: "June 12",
            scheduledTime: "10:00 AM",
          },
          cta: {
            label: "View Details",
            action: "OPEN_CONFIRMATION",
            payload: { id: "abc" },
          },
        }}
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: /View Details/i }));
    expect(onAction).toHaveBeenCalledWith("OPEN_CONFIRMATION", { id: "abc" });
  });

  it("dispatches quote actions and renders range", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <QuoteCard
        payload={{
          title: "Estimate",
          summary: "Estimated range based on details provided",
          range: {
            min: 150,
            max: 300,
            currency: "USD",
          },
          cta: {
            label: "Book Now",
            action: "BOOK_NOW",
          },
        }}
        onAction={onAction}
      />,
    );

    expect(screen.getByText("USD 150 - 300")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Book Now/i }));
    expect(onAction).toHaveBeenCalledWith("BOOK_NOW", undefined);
  });

  it("renders emergency instructions and CTA", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <EmergencyInstructionsCard
        payload={{
          title: "Immediate assistance",
          message: "Please follow these steps.",
          severity: "critical",
          instructions: ["Shut off water", "Move valuables"],
          contactLabel: "Emergency line",
          contactPhone: "(617) 555-0111",
          cta: {
            label: "Call Now",
            action: "CALL_EMERGENCY",
          },
        }}
        onAction={onAction}
      />,
    );

    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Shut off water")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Call Now/i }));
    expect(onAction).toHaveBeenCalledWith("CALL_EMERGENCY", undefined);
  });
});

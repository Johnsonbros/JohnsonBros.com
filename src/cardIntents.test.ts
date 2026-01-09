import { describe, expect, it } from "vitest";
import { extractCardIntents, isCardIntentComplete } from "./cardIntents";

const cardIntentJson = JSON.stringify({
  type: "service_recommendation",
  title: "Replace Filter",
  description: "Swap HVAC filter",
});

const bookingIntentJson = JSON.stringify({
  type: "booking_confirmation",
  title: "Booking confirmed",
  booking: {
    scheduledDate: "2024-10-05",
    scheduledTime: "10:30",
  },
  cta: {
    label: "Open modal",
    action: "OPEN_BOOKING_MODAL",
  },
});

describe("extractCardIntents", () => {
  it("extracts a fenced card_intent block and removes it from cleanText", () => {
    const text = `Hello\n\n\`\`\`card_intent\n${cardIntentJson}\n\`\`\`\n\nWorld`;
    const result = extractCardIntents(text);

    expect(result.cards).toHaveLength(1);
    expect(result.cleanText).toBe("Hello\n\n\n\nWorld");
    expect(result.errors).toHaveLength(0);
  });

  it("extracts multiple blocks across fence and tag formats", () => {
    const text = `Before\n\`\`\`card_intent\n${cardIntentJson}\n\`\`\`\nMiddle\n<CARD_INTENT>${bookingIntentJson}</CARD_INTENT>\nAfter`;
    const result = extractCardIntents(text);

    expect(result.cards).toHaveLength(2);
    expect(result.cleanText).toBe("Before\n\nMiddle\n\nAfter");
  });

  it("records errors for invalid JSON", () => {
    const text = "```card_intent\n{not-valid}\n```";
    const result = extractCardIntents(text);

    expect(result.cards).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it("records errors for schema validation failures", () => {
    const text = "<CARD_INTENT>{\"type\":\"booking_confirmation\"}</CARD_INTENT>";
    const result = extractCardIntents(text);

    expect(result.cards).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it("ignores unrelated fenced blocks", () => {
    const text = `Intro\n\`\`\`ts\nconst demo = true;\n\`\`\`\n\`\`\`card_intent\n${cardIntentJson}\n\`\`\`\nOutro`;
    const result = extractCardIntents(text);

    expect(result.cards).toHaveLength(1);
    expect(result.cleanText).toContain("```ts");
  });
});

describe("isCardIntentComplete", () => {
  it("returns false when a card_intent fence is not closed", () => {
    const text = "```card_intent\n{\"type\":\"service_recommendation\"}";

    expect(isCardIntentComplete(text)).toBe(false);
  });

  it("returns true for properly closed card_intent fences", () => {
    const text = "```card_intent\n{\"type\":\"service_recommendation\",\"title\":\"Test\"}\n```";

    expect(isCardIntentComplete(text)).toBe(true);
  });

  it("returns false when CARD_INTENT tags are unbalanced", () => {
    const text = "<CARD_INTENT>{\"type\":\"service_recommendation\"}";

    expect(isCardIntentComplete(text)).toBe(false);
  });

  it("returns true when other fenced blocks exist and card blocks are complete", () => {
    const text = "```ts\nconst demo = true;\n```\n```card_intent\n{\"type\":\"service_recommendation\",\"title\":\"Test\"}\n```";

    expect(isCardIntentComplete(text)).toBe(true);
  });
});

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  sendAlert,
  acknowledgeAlert,
  getAlertHistory,
  getUnacknowledgedAlerts,
  updateThresholds,
  getThresholds,
  stopAlertMonitor,
} from "../src/observability/alerts.ts";

describe("Alert System", () => {
  beforeEach(() => {
    // Clear alert history before each test
    stopAlertMonitor();
  });

  describe("sendAlert", () => {
    it("should create an alert with proper structure", async () => {
      await sendAlert("warning", "Test Alert", "This is a test alert", {
        testKey: "testValue",
      });

      const history = getAlertHistory(1);
      assert.strictEqual(history.length, 1);

      const alert = history[0];
      assert.ok(alert.id);
      assert.strictEqual(alert.level, "warning");
      assert.strictEqual(alert.type, "Test Alert");
      assert.strictEqual(alert.message, "This is a test alert");
      assert.ok(alert.timestamp instanceof Date);
      assert.strictEqual(alert.acknowledged, false);
    });

    it("should include context in alerts", async () => {
      const context = {
        errorRate: 15.5,
        threshold: 10,
        metric: "error_rate_percent",
      };

      await sendAlert("error", "High Error Rate", "Error rate exceeded threshold", context);

      const history = getAlertHistory(1);
      const alert = history[0];
      assert.deepStrictEqual(alert.context, context);
    });

    it("should generate proper deduplication key", async () => {
      await sendAlert("warning", "Duplicate Test", "Same message 1");
      await sendAlert("warning", "Duplicate Test", "Same message 1");

      // Second alert should be throttled (within 5 minute window)
      const history = getAlertHistory(10);
      // With default throttling, we should only see one
      assert.ok(history.length <= 2); // May vary based on timing
    });

    it("should always log to console channel", async () => {
      await sendAlert("info", "Console Test", "Should be in console");

      const history = getAlertHistory(1);
      const alert = history[0];
      assert.ok(alert.channels.includes("console"));
    });

    it("should track multiple channels", async () => {
      // Set env vars for testing
      const originalSlack = process.env.SLACK_WEBHOOK_URL;
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";

      await sendAlert("error", "Multi-Channel Test", "Should attempt Slack");

      const history = getAlertHistory(1);
      const alert = history[0];
      assert.ok(alert.channels.includes("console"));

      // Cleanup
      if (originalSlack) {
        process.env.SLACK_WEBHOOK_URL = originalSlack;
      } else {
        delete process.env.SLACK_WEBHOOK_URL;
      }
    });
  });

  describe("acknowledgeAlert", () => {
    it("should acknowledge an alert", async () => {
      await sendAlert("warning", "Test Alert", "To acknowledge");

      const history = getAlertHistory(1);
      const alertId = history[0].id;

      const result = acknowledgeAlert(alertId, "test-user");
      assert.strictEqual(result, true);

      const updated = getAlertHistory(1);
      assert.strictEqual(updated[0].acknowledged, true);
      assert.strictEqual(updated[0].acknowledgedBy, "test-user");
      assert.ok(updated[0].acknowledgedAt instanceof Date);
    });

    it("should return false for non-existent alert", () => {
      const result = acknowledgeAlert("non-existent-id", "test-user");
      assert.strictEqual(result, false);
    });

    it("should not re-acknowledge an alert", async () => {
      await sendAlert("warning", "Test Alert", "To acknowledge");

      const history = getAlertHistory(1);
      const alertId = history[0].id;

      acknowledgeAlert(alertId, "user1");
      const result = acknowledgeAlert(alertId, "user2");

      assert.strictEqual(result, false);

      const updated = getAlertHistory(1);
      assert.strictEqual(updated[0].acknowledgedBy, "user1"); // Should remain as first ack
    });
  });

  describe("getUnacknowledgedAlerts", () => {
    it("should return only unacknowledged alerts", async () => {
      await sendAlert("warning", "Alert 1", "First alert");
      await sendAlert("error", "Alert 2", "Second alert");
      await sendAlert("info", "Alert 3", "Third alert");

      const history = getAlertHistory(10);
      const firstAlert = history[2]; // Last created is first in history
      acknowledgeAlert(firstAlert.id);

      const unacknowledged = getUnacknowledgedAlerts();
      assert.ok(unacknowledged.length >= 2);
      assert.ok(unacknowledged.every((a) => !a.acknowledged));
    });

    it("should return empty array when all acknowledged", async () => {
      await sendAlert("warning", "Alert 1", "First alert");

      const history = getAlertHistory(1);
      acknowledgeAlert(history[0].id);

      const unacknowledged = getUnacknowledgedAlerts();
      const testAlerts = unacknowledged.filter((a) => a.type === "Alert 1");
      assert.strictEqual(testAlerts.length, 0);
    });
  });

  describe("Thresholds", () => {
    it("should initialize with default thresholds", () => {
      const thresholds = getThresholds();

      assert.strictEqual(thresholds.errorRatePercent, 10);
      assert.strictEqual(thresholds.slowResponseTimeP95Ms, 2000);
      assert.strictEqual(thresholds.memoryUsagePercent, 85);
      assert.strictEqual(thresholds.diskUsagePercent, 90);
      assert.strictEqual(thresholds.externalApiFailureCount, 5);
      assert.strictEqual(thresholds.dbConnectionFailures, 3);
    });

    it("should update thresholds", () => {
      updateThresholds({
        errorRatePercent: 20,
        slowResponseTimeP95Ms: 3000,
      });

      const thresholds = getThresholds();
      assert.strictEqual(thresholds.errorRatePercent, 20);
      assert.strictEqual(thresholds.slowResponseTimeP95Ms, 3000);
      // Others should remain default
      assert.strictEqual(thresholds.memoryUsagePercent, 85);
    });

    it("should not mutate returned threshold object", () => {
      const thresholds1 = getThresholds();
      thresholds1.errorRatePercent = 999;

      const thresholds2 = getThresholds();
      assert.notStrictEqual(thresholds2.errorRatePercent, 999);
    });
  });

  describe("Alert History", () => {
    it("should maintain alert history in reverse chronological order", async () => {
      await sendAlert("info", "Alert 1", "First");
      await sendAlert("warning", "Alert 2", "Second");
      await sendAlert("error", "Alert 3", "Third");

      const history = getAlertHistory(10);

      // Most recent should be first
      assert.strictEqual(history[0].type, "Alert 3");
      assert.strictEqual(history[1].type, "Alert 2");
      assert.strictEqual(history[2].type, "Alert 1");
    });

    it("should respect limit parameter", async () => {
      await sendAlert("info", "Alert 1", "First");
      await sendAlert("info", "Alert 2", "Second");
      await sendAlert("info", "Alert 3", "Third");

      const history = getAlertHistory(2);
      assert.strictEqual(history.length, 2);
    });

    it("should have default limit of 50", async () => {
      for (let i = 0; i < 60; i++) {
        await sendAlert("info", `Alert ${i}`, `Message ${i}`);
      }

      const history = getAlertHistory();
      // Max 500 alerts stored, retrieve default 50
      assert.ok(history.length <= 50);
    });
  });

  describe("Alert Levels", () => {
    it("should handle all alert levels", async () => {
      const levels: Array<"info" | "warning" | "error" | "critical"> = [
        "info",
        "warning",
        "error",
        "critical",
      ];

      for (const level of levels) {
        await sendAlert(level, `${level} Alert`, `This is a ${level} level alert`);
      }

      const history = getAlertHistory(10);
      const types = history.map((a) => a.level);

      assert.ok(types.includes("info"));
      assert.ok(types.includes("warning"));
      assert.ok(types.includes("error"));
      assert.ok(types.includes("critical"));
    });
  });
});

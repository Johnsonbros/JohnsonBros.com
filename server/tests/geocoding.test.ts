import { describe, it } from "node:test";
import assert from "node:assert";
import { checkServiceArea, geocodeAddress } from "../src/geocoding.ts";

describe("Geocoding Service", () => {
  it("should return proper structure even without API key", async () => {
    const result = await checkServiceArea("123 Main St, Quincy, MA");

    assert.ok(typeof result.inServiceArea === "boolean");
    assert.ok(typeof result.message === "string");
    assert.ok(result.zipCode === null || typeof result.zipCode === "string");
  });

  it("should handle empty address gracefully", async () => {
    const result = await geocodeAddress("");

    assert.strictEqual(result.zipCode, null);
    assert.strictEqual(result.city, null);
    assert.strictEqual(result.state, null);
  });
});

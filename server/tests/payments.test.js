import test from "node:test";
import assert from "node:assert/strict";
import { splitAmount } from "../src/services/payments.js";

test("platform keeps configured fee in test mode", () => {
  const { platformFee, instructorPayout } = splitAmount(100);
  assert.equal(platformFee + instructorPayout, 100);
  assert.ok(instructorPayout > platformFee);
});

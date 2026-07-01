import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { proofEventTimestampLabel } from "../src/lib/proof-events/time.js";
import type { ProofEvent } from "../src/types/domain.js";

function event(createdAt: string): ProofEvent {
  return {
    id: "event-1",
    type: "OBJECT_VERIFIED",
    title: "OBJECT_VERIFIED",
    detail: "object sealed",
    status: "verified",
    createdAt,
    timestampLabel: "now"
  };
}

describe("proof event time labels", () => {
  it("keeps a fresh event as now, then renders real age from createdAt", () => {
    const proofEvent = event("2026-07-01T20:30:00.000Z");

    assert.equal(proofEventTimestampLabel(proofEvent, new Date("2026-07-01T20:30:20.000Z")), "now");
    assert.equal(proofEventTimestampLabel(proofEvent, new Date("2026-07-01T20:32:01.000Z")), "2m ago");
  });

  it("keeps legacy labels when no durable creation time exists", () => {
    const legacyEvent = {
      ...event("2026-07-01T20:30:00.000Z"),
      createdAt: undefined,
      timestampLabel: "8m ago"
    };

    assert.equal(proofEventTimestampLabel(legacyEvent, new Date("2026-07-01T20:40:00.000Z")), "8m ago");
  });
});

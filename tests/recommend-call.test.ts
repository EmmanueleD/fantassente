import { describe, expect, it } from "vitest";
import { recommendMiglioCallName } from "@/lib/auction/recommend-call";

import type { MiglioCallCandidate } from "@/lib/auction/recommend-call";

const candidates: MiglioCallCandidate[] = [
  { slot: "P1", playerName: "Secondo Portiere", priority: 2 },
  { slot: "P1", playerName: "Primo Portiere", priority: 1 },
  { slot: "D1", playerName: "Primo Difensore", priority: 1 },
];

describe("recommendMiglioCallName", () => {
  it("returns the highest-priority candidate name for the first open slot", () => {
    expect(recommendMiglioCallName(["P1", "D1"], candidates)).toBe("Primo Portiere");
  });

  it("does not skip to later open slots when the first open slot has no candidates", () => {
    expect(recommendMiglioCallName(["C1", "D1"], candidates)).toBeNull();
  });

  it("returns null when there are no open slots", () => {
    expect(recommendMiglioCallName([], candidates)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { evaluateBid } from "@/lib/bidding/evaluate-bid";
import type { CandidateRow, EvaluateBidInput, PurchaseRow } from "@/lib/types";

const NO_BUDGET_CONSTRAINT = 1_000_000;

const label = (status: string, nextBid: number | null): string => {
  switch (status) {
    case "ACTIVE":
      return `MIGLIO RILANCIA A ${nextBid}`;
    case "OUT":
      return "MIGLIO PASSA";
    case "NOT_INTERESTED":
      return "NON INTERESSATO";
    case "SLOT_FULL":
      return "SLOT GIÀ OCCUPATO";
    default:
      throw new Error(`unknown status ${status}`);
  }
};

/** Builds an EvaluateBidInput with sane defaults, overridable per test. */
function input(overrides: Partial<EvaluateBidInput> & Pick<EvaluateBidInput, "playerName" | "proposedBid">): EvaluateBidInput {
  return {
    slot: null,
    candidates: [],
    purchases: [],
    initialBudget: NO_BUDGET_CONSTRAINT,
    ...overrides,
  };
}

/** N purchases summing to `totalSpent`, using distinct D-group slots (cheap filler, never matched by name). */
function fillerPurchases(count: number, totalSpent: number): PurchaseRow[] {
  const per = Math.floor(totalSpent / count);
  const remainder = totalSpent - per * count;
  return Array.from({ length: count }, (_, i) => ({
    slot: `D${(i % 8) + 1}` as PurchaseRow["slot"],
    finalPrice: per + (i === 0 ? remainder : 0),
  }));
}

describe("evaluateBid — 7 mandatory acceptance cases (spec §9)", () => {
  it("case 1: max=100, bid=80, no binding budget → ACTIVE, nextBid=81", () => {
    const candidates: CandidateRow[] = [{ slot: "A1", playerName: "Lautaro", maxPrice: 100, priority: 1 }];
    const result = evaluateBid(input({ playerName: "Lautaro", proposedBid: 80, candidates }));
    expect(result).toEqual({ status: "ACTIVE", nextBid: 81 });
    expect(label(result.status, result.nextBid)).toBe("MIGLIO RILANCIA A 81");
  });

  it("case 2: max=100, bid=100 (== max) → OUT", () => {
    const candidates: CandidateRow[] = [{ slot: "A1", playerName: "Lautaro", maxPrice: 100, priority: 1 }];
    const result = evaluateBid(input({ playerName: "Lautaro", proposedBid: 100, candidates }));
    expect(result).toEqual({ status: "OUT", nextBid: null });
    expect(label(result.status, result.nextBid)).toBe("MIGLIO PASSA");
  });

  it("case 3: unknown playerName → NOT_INTERESTED", () => {
    const candidates: CandidateRow[] = [{ slot: "A1", playerName: "Lautaro", maxPrice: 100, priority: 1 }];
    const result = evaluateBid(input({ playerName: "Nobody", proposedBid: 10, candidates }));
    expect(result).toEqual({ status: "NOT_INTERESTED", nextBid: null });
    expect(label(result.status, result.nextBid)).toBe("NON INTERESSATO");
  });

  it("case 4: candidate in A1(80) and A2(55), both open, explicit slot=A1 → uses M=80", () => {
    const candidates: CandidateRow[] = [
      { slot: "A1", playerName: "Lautaro", maxPrice: 80, priority: 1 },
      { slot: "A2", playerName: "Lautaro", maxPrice: 55, priority: 2 },
    ];
    expect(evaluateBid(input({ playerName: "Lautaro", proposedBid: 60, slot: "A1", candidates }))).toEqual({
      status: "ACTIVE",
      nextBid: 61,
    });
    expect(evaluateBid(input({ playerName: "Lautaro", proposedBid: 80, slot: "A1", candidates }))).toEqual({
      status: "OUT",
      nextBid: null,
    });
  });

  it("case 5: A1 filled → falls through to A2 (ceiling 55), with null slot and with stale slot=A1", () => {
    const candidates: CandidateRow[] = [
      { slot: "A1", playerName: "Lautaro", maxPrice: 80, priority: 1 },
      { slot: "A2", playerName: "Lautaro", maxPrice: 55, priority: 2 },
    ];
    const purchases: PurchaseRow[] = [{ slot: "A1", finalPrice: 79 }];
    expect(evaluateBid(input({ playerName: "Lautaro", proposedBid: 54, slot: null, candidates, purchases }))).toEqual({
      status: "ACTIVE",
      nextBid: 55,
    });
    expect(evaluateBid(input({ playerName: "Lautaro", proposedBid: 55, slot: null, candidates, purchases }))).toEqual({
      status: "OUT",
      nextBid: null,
    });
    expect(evaluateBid(input({ playerName: "Lautaro", proposedBid: 54, slot: "A1", candidates, purchases }))).toEqual({
      status: "ACTIVE",
      nextBid: 55,
    });
  });

  it("case 6: remaining=50, 5 open slots (reserved=4) → ceiling 46, budget-forced pass", () => {
    const initialBudget = 500;
    const purchases = fillerPurchases(20, 450); // 25 total - 20 filled = 5 open; remaining = 50
    const candidates: CandidateRow[] = [{ slot: "A1", playerName: "Lautaro", maxPrice: 100, priority: 1 }];

    const outAt46 = evaluateBid(input({ playerName: "Lautaro", proposedBid: 46, slot: "A1", candidates, purchases, initialBudget }));
    expect(outAt46).toEqual({ status: "OUT", nextBid: null });
    expect(label(outAt46.status, outAt46.nextBid)).toBe("MIGLIO PASSA");

    expect(evaluateBid(input({ playerName: "Lautaro", proposedBid: 45, slot: "A1", candidates, purchases, initialBudget }))).toEqual({
      status: "ACTIVE",
      nextBid: 46,
    });
  });

  it("case 7 (structural): response has exactly the keys status/nextBid, no leaked fields, across a status matrix", () => {
    const candidates: CandidateRow[] = [
      { slot: "A1", playerName: "Lautaro", maxPrice: 100, priority: 1 },
      { slot: "A2", playerName: "Icardi", maxPrice: 10, priority: 1 },
    ];
    const purchases: PurchaseRow[] = [{ slot: "A2", finalPrice: 9 }];
    const results = [
      evaluateBid(input({ playerName: "Lautaro", proposedBid: 50, candidates, purchases })), // ACTIVE
      evaluateBid(input({ playerName: "Lautaro", proposedBid: 100, candidates, purchases })), // OUT
      evaluateBid(input({ playerName: "Nobody", proposedBid: 1, candidates, purchases })), // NOT_INTERESTED
      evaluateBid(input({ playerName: "Icardi", proposedBid: 1, candidates, purchases })), // SLOT_FULL
    ];
    for (const result of results) {
      expect(Object.keys(result).sort()).toEqual(["nextBid", "status"]);
      const json = JSON.stringify(result);
      expect(json).not.toContain("maxPrice");
      expect(json).not.toContain("priority");
    }
  });
});

describe("evaluateBid — edge cases (spec §8)", () => {
  it("SLOT_FULL when every matching candidate slot is filled", () => {
    const candidates: CandidateRow[] = [{ slot: "A1", playerName: "Icardi", maxPrice: 10, priority: 1 }];
    const purchases: PurchaseRow[] = [{ slot: "A1", finalPrice: 5 }];
    expect(evaluateBid(input({ playerName: "Icardi", proposedBid: 1, candidates, purchases }))).toEqual({
      status: "SLOT_FULL",
      nextBid: null,
    });
  });

  it("case/whitespace normalization: '  lAuTaRo ' resolves to 'Lautaro' candidate", () => {
    const candidates: CandidateRow[] = [{ slot: "A1", playerName: "Lautaro", maxPrice: 100, priority: 1 }];
    expect(evaluateBid(input({ playerName: "  lAuTaRo ", proposedBid: 80, candidates }))).toEqual({
      status: "ACTIVE",
      nextBid: 81,
    });
  });

  it("last open slot: reserved=0, ceiling = full remaining budget", () => {
    const purchases = fillerPurchases(24, 24); // 24 filled at 1 each, 1 open (the one under test)
    const candidates: CandidateRow[] = [{ slot: "A1", playerName: "Lautaro", maxPrice: 1000, priority: 1 }];
    const initialBudget = 24 + 30; // remaining = 30, reserved = 0
    expect(evaluateBid(input({ playerName: "Lautaro", proposedBid: 30, slot: "A1", candidates, purchases, initialBudget }))).toEqual({
      status: "OUT",
      nextBid: null,
    });
    expect(evaluateBid(input({ playerName: "Lautaro", proposedBid: 29, slot: "A1", candidates, purchases, initialBudget }))).toEqual({
      status: "ACTIVE",
      nextBid: 30,
    });
  });

  it("effectiveCeiling <= 0 → OUT for any non-negative bid", () => {
    const candidates: CandidateRow[] = [{ slot: "A1", playerName: "Lautaro", maxPrice: 100, priority: 1 }];
    // 25 open slots (no purchases), reserved = 24, maxAffordable = 5 - 24 = -19 <= 0
    expect(evaluateBid(input({ playerName: "Lautaro", proposedBid: 1, slot: "A1", candidates, initialBudget: 5 }))).toEqual({
      status: "OUT",
      nextBid: null,
    });
  });

  it("empty candidates array → NOT_INTERESTED", () => {
    expect(evaluateBid(input({ playerName: "Anyone", proposedBid: 1 }))).toEqual({
      status: "NOT_INTERESTED",
      nextBid: null,
    });
  });

  it("priority tie between two open candidates → alphabetically-first slot code wins", () => {
    const candidates: CandidateRow[] = [
      { slot: "A2", playerName: "Lautaro", maxPrice: 55, priority: 1 },
      { slot: "A1", playerName: "Lautaro", maxPrice: 80, priority: 1 },
    ];
    expect(evaluateBid(input({ playerName: "Lautaro", proposedBid: 79, candidates }))).toEqual({
      status: "ACTIVE",
      nextBid: 80,
    });
  });
});

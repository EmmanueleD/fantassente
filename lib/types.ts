/**
 * Shared domain types.
 * Const-object-then-derived-union pattern (typescript skill).
 */

export const ROLE = {
  MIGLIO: "miglio",
  JABU: "jabu",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const BID_STATUS = {
  ACTIVE: "ACTIVE",
  OUT: "OUT",
  NOT_INTERESTED: "NOT_INTERESTED",
  SLOT_FULL: "SLOT_FULL",
} as const;

export type BidStatus = (typeof BID_STATUS)[keyof typeof BID_STATUS];

import type { SlotCode } from "./slots";

/** A candidate (strategy entry) row, camelCase, as consumed by the pure bidding logic. */
export interface CandidateRow {
  slot: SlotCode;
  playerName: string;
  maxPrice: number;
  priority: number;
}

/** A purchase (filled slot) row, camelCase, as consumed by the pure bidding logic. */
export interface PurchaseRow {
  slot: SlotCode;
  finalPrice: number;
}

/** Input to the pure evaluateBid function (design §4.1). */
export interface EvaluateBidInput {
  playerName: string;
  proposedBid: number;
  slot: SlotCode | null;
  candidates: CandidateRow[];
  purchases: PurchaseRow[];
  initialBudget: number;
}

/** Exhaustive result shape — spec §2.2, must never gain/lose fields. */
export interface BidCheckResult {
  status: BidStatus;
  nextBid: number | null;
}

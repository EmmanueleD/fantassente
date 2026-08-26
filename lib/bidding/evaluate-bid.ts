/**
 * PURE bid evaluation function (spec §3, design §4.1).
 *
 * No Supabase, no Next.js, no "server-only" import — this module is
 * dependency-free (only ../types, ../slots, ../normalize) so it can be
 * unit-tested with zero mocking and can never leak the secret max_price
 * into a client bundle by construction: it never receives or returns a
 * DB row, and its output type has exactly two fields (status, nextBid).
 */
import type { BidCheckResult, CandidateRow, EvaluateBidInput } from "../types";
import { BID_STATUS } from "../types";
import { TOTAL_SLOTS } from "../slots";
import { normalizeName } from "../normalize";

export function evaluateBid(input: EvaluateBidInput): BidCheckResult {
  const { playerName, proposedBid, slot, candidates, purchases, initialBudget } = input;

  // §3.1 step 1: normalized name matching.
  const target = normalizeName(playerName);
  const matches = candidates.filter((c) => normalizeName(c.playerName) === target);

  // §3.2 step 4: zero matches at all → NOT_INTERESTED.
  if (matches.length === 0) {
    return { status: BID_STATUS.NOT_INTERESTED, nextBid: null };
  }

  // §3.1 step 2 + §3.2 step 5: partition into OPEN vs FILLED, all-filled → SLOT_FULL.
  const filledSlots = new Set(purchases.map((p) => p.slot));
  const open = matches.filter((c) => !filledSlots.has(c.slot));
  if (open.length === 0) {
    return { status: BID_STATUS.SLOT_FULL, nextBid: null };
  }

  // §3.1 step 3 / §3.3: slot selection among open candidates.
  const selected = selectCandidate(open, slot);

  // §3.4: budget ceiling computation.
  const remaining = initialBudget - purchases.reduce((sum, p) => sum + p.finalPrice, 0);
  const openSlotsCount = TOTAL_SLOTS - purchases.length;
  const reserved = openSlotsCount - 1;
  const maxAffordable = remaining - reserved;
  const effectiveCeiling = Math.min(selected.maxPrice, maxAffordable);

  // §3.5: verdict + nextBid, no separate clamping step (spec D3).
  if (proposedBid < effectiveCeiling) {
    return { status: BID_STATUS.ACTIVE, nextBid: proposedBid + 1 };
  }
  return { status: BID_STATUS.OUT, nextBid: null };
}

/**
 * §2.1 / §3.3 disambiguation: explicit slot context wins when it matches an
 * open candidate; otherwise lowest priority wins, ties broken by slot code
 * ascending (alphabetically-first slot).
 */
function selectCandidate(open: CandidateRow[], slot: EvaluateBidInput["slot"]): CandidateRow {
  if (slot !== null) {
    const explicit = open.find((c) => c.slot === slot);
    if (explicit) {
      return explicit;
    }
  }

  return open.reduce((best, current) => {
    if (current.priority < best.priority) {
      return current;
    }
    if (current.priority === best.priority && current.slot < best.slot) {
      return current;
    }
    return best;
  });
}

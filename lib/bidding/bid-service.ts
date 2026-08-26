import "server-only";
import type { BidCheckResult, CandidateRow, PurchaseRow } from "../types";
import type { SlotCode } from "../slots";
import { getSupabaseServerClient } from "../supabase/server-client";
import { evaluateBid } from "./evaluate-bid";

interface CandidateDbRow {
  slot: SlotCode;
  player_name: string;
  max_price: number;
  priority: number;
}

interface PurchaseDbRow {
  slot: SlotCode;
  final_price: number;
}

/**
 * Thin server-side adapter (design §4.2): fetches the minimal rows needed,
 * maps them to the pure evaluateBid input shape, and returns its result
 * unchanged. Never uses select("*").
 */
export async function runBidCheck(
  playerName: string,
  proposedBid: number,
  slot: SlotCode | null
): Promise<BidCheckResult> {
  const client = getSupabaseServerClient();

  const [candidatesRes, purchasesRes, configRes] = await Promise.all([
    client.from("candidates").select("slot, player_name, max_price, priority"),
    client.from("purchases").select("slot, final_price"),
    client.from("app_config").select("initial_budget").eq("id", true).single(),
  ]);

  if (candidatesRes.error) {
    throw candidatesRes.error;
  }
  if (purchasesRes.error) {
    throw purchasesRes.error;
  }
  if (configRes.error) {
    throw configRes.error;
  }

  const candidates: CandidateRow[] = (candidatesRes.data as CandidateDbRow[]).map((row) => ({
    slot: row.slot,
    playerName: row.player_name,
    maxPrice: row.max_price,
    priority: row.priority,
  }));

  const purchases: PurchaseRow[] = (purchasesRes.data as PurchaseDbRow[]).map((row) => ({
    slot: row.slot,
    finalPrice: row.final_price,
  }));

  const initialBudget = (configRes.data as { initial_budget: number }).initial_budget;

  return evaluateBid({
    playerName,
    proposedBid,
    slot,
    candidates,
    purchases,
    initialBudget,
  });
}

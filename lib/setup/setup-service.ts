import "server-only";
import { getSupabaseServerClient } from "../supabase/server-client";
import type { SlotCode } from "../slots";

export interface CandidateSetupRow {
  id: number;
  slot: SlotCode;
  playerName: string;
  maxPrice: number;
  priority: number;
}

interface CandidateDbRow {
  id: number;
  slot: SlotCode;
  player_name: string;
  max_price: number;
  priority: number;
}

export interface SetupData {
  candidates: CandidateSetupRow[];
  initialBudget: number;
  filledSlots: SlotCode[];
  /** Real spend to date, from actual purchases only. */
  actualSpent: number;
  /** initialBudget - actualSpent. */
  actualRemainingBudget: number;
  /** Real purchase rows, most-recent-first. */
  purchases: { slot: SlotCode; playerName: string; finalPrice: number }[];
}

/** Result of a write operation. `error` is a short machine-readable code, not user-facing copy. */
export type WriteResult = { ok: true } | { ok: false; error: string };

/** Fetches everything Miglio's `/setup` page needs: candidates (all fields), config, filled slots, spend. */
export async function getSetupData(): Promise<SetupData> {
  const client = getSupabaseServerClient();
  const [candidatesRes, configRes, purchasesRes] = await Promise.all([
    client.from("candidates").select("id, slot, player_name, max_price, priority"),
    client.from("app_config").select("initial_budget").eq("id", true).single(),
    client.from("purchases").select("slot, player_name, final_price").order("purchased_at", { ascending: false }),
  ]);

  if (candidatesRes.error) {
    throw candidatesRes.error;
  }
  if (configRes.error) {
    throw configRes.error;
  }
  if (purchasesRes.error) {
    throw purchasesRes.error;
  }

  const candidates: CandidateSetupRow[] = (candidatesRes.data as CandidateDbRow[]).map((row) => ({
    id: row.id,
    slot: row.slot,
    playerName: row.player_name,
    maxPrice: row.max_price,
    priority: row.priority,
  }));

  const config = configRes.data as { initial_budget: number };
  const purchasesRows = purchasesRes.data as { slot: SlotCode; player_name: string; final_price: number }[];
  const filledSlots = purchasesRows.map((row) => row.slot);
  const actualSpent = purchasesRows.reduce((sum, row) => sum + row.final_price, 0);
  const purchases = purchasesRows.map((row) => ({
    slot: row.slot,
    playerName: row.player_name,
    finalPrice: row.final_price,
  }));

  return {
    candidates,
    initialBudget: config.initial_budget,
    filledSlots,
    actualSpent,
    actualRemainingBudget: config.initial_budget - actualSpent,
    purchases,
  };
}

export async function addCandidate(
  slot: SlotCode,
  playerName: string,
  maxPrice: number,
  priority: number
): Promise<WriteResult> {
  const client = getSupabaseServerClient();

  const { error } = await client
    .from("candidates")
    .insert({ slot, player_name: playerName, max_price: maxPrice, priority });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function updateCandidatePrice(id: number, maxPrice: number): Promise<WriteResult> {
  const client = getSupabaseServerClient();

  const { error } = await client.from("candidates").update({ max_price: maxPrice }).eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteCandidate(id: number): Promise<WriteResult> {
  const client = getSupabaseServerClient();

  const { error } = await client.from("candidates").delete().eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Rewrites priority within a single slot as a dense 1..n sequence, per the given order of ids. */
export async function reorderCandidates(slot: SlotCode, orderedIds: number[]): Promise<WriteResult> {
  const client = getSupabaseServerClient();

  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await client
      .from("candidates")
      .update({ priority: index + 1 })
      .eq("id", orderedIds[index])
      .eq("slot", slot);
    if (error) {
      return { ok: false, error: error.message };
    }
  }
  return { ok: true };
}

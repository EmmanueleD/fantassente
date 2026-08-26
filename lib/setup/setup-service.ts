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
  strategyLocked: boolean;
  filledSlots: SlotCode[];
}

/** Result of a write operation. `error` is a short machine-readable code, not user-facing copy. */
export type WriteResult = { ok: true } | { ok: false; error: string };

type SupabaseClient = ReturnType<typeof getSupabaseServerClient>;

/**
 * Reads the current strategy_locked flag directly from the DB (spec §5).
 * This is the single enforcement point: every write function below calls
 * this itself rather than trusting its caller, so a hand-crafted call that
 * bypasses the Server Action / UI layer still gets rejected.
 */
async function readStrategyLocked(client: SupabaseClient): Promise<boolean> {
  const { data, error } = await client
    .from("app_config")
    .select("strategy_locked")
    .eq("id", true)
    .single();
  if (error) {
    throw error;
  }
  return (data as { strategy_locked: boolean }).strategy_locked;
}

async function rejectIfLocked(client: SupabaseClient): Promise<WriteResult | null> {
  const locked = await readStrategyLocked(client);
  if (locked) {
    return { ok: false, error: "LOCKED" };
  }
  return null;
}

/** Fetches everything Miglio's `/setup` page needs: candidates (all fields), config, filled slots. */
export async function getSetupData(): Promise<SetupData> {
  const client = getSupabaseServerClient();
  const [candidatesRes, configRes, purchasesRes] = await Promise.all([
    client.from("candidates").select("id, slot, player_name, max_price, priority"),
    client.from("app_config").select("initial_budget, strategy_locked").eq("id", true).single(),
    client.from("purchases").select("slot"),
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

  const config = configRes.data as { initial_budget: number; strategy_locked: boolean };
  const filledSlots = (purchasesRes.data as { slot: SlotCode }[]).map((row) => row.slot);

  return {
    candidates,
    initialBudget: config.initial_budget,
    strategyLocked: config.strategy_locked,
    filledSlots,
  };
}

export async function addCandidate(
  slot: SlotCode,
  playerName: string,
  maxPrice: number,
  priority: number
): Promise<WriteResult> {
  const client = getSupabaseServerClient();
  const blocked = await rejectIfLocked(client);
  if (blocked) {
    return blocked;
  }

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
  const blocked = await rejectIfLocked(client);
  if (blocked) {
    return blocked;
  }

  const { error } = await client.from("candidates").update({ max_price: maxPrice }).eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteCandidate(id: number): Promise<WriteResult> {
  const client = getSupabaseServerClient();
  const blocked = await rejectIfLocked(client);
  if (blocked) {
    return blocked;
  }

  const { error } = await client.from("candidates").delete().eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Rewrites priority within a single slot as a dense 1..n sequence, per the given order of ids. */
export async function reorderCandidates(slot: SlotCode, orderedIds: number[]): Promise<WriteResult> {
  const client = getSupabaseServerClient();
  const blocked = await rejectIfLocked(client);
  if (blocked) {
    return blocked;
  }

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

export async function setInitialBudget(initialBudget: number): Promise<WriteResult> {
  const client = getSupabaseServerClient();
  const blocked = await rejectIfLocked(client);
  if (blocked) {
    return blocked;
  }

  const { error } = await client
    .from("app_config")
    .update({ initial_budget: initialBudget })
    .eq("id", true);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Locking is exempt from its own lock check and idempotent (spec §5):
 * setting strategy_locked = true when already true is a no-op success, not an error.
 */
export async function lockStrategy(): Promise<WriteResult> {
  const client = getSupabaseServerClient();
  const { error } = await client
    .from("app_config")
    .update({ strategy_locked: true })
    .eq("id", true);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Unlocking supersedes the app's original one-way lock design: Miglio can now
 * unlock, edit candidates/budget, and re-lock through the UI itself. The
 * manual SQL escape hatch documented in the README is retained only as a
 * fallback for when the app itself is unreachable, not as the primary path.
 *
 * Like locking, this is exempt from its own lock check (you can't unlock
 * what's locked if unlocking itself is blocked by the lock check) and
 * idempotent: unlocking an already-unlocked strategy is a no-op success, not
 * an error.
 */
export async function unlockStrategy(): Promise<WriteResult> {
  const client = getSupabaseServerClient();
  const { error } = await client
    .from("app_config")
    .update({ strategy_locked: false })
    .eq("id", true);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

import "server-only";
import { getSupabaseServerClient } from "../supabase/server-client";
import { TOTAL_SLOTS, type SlotCode } from "../slots";

/** Result of an assignment attempt (spec §4). `error` is a machine-readable code. */
export type PurchaseResult =
  | { ok: true; remainingBudget: number }
  | { ok: false; error: "SLOT_FILLED" }
  | { ok: false; error: "PRICE_EXCEEDS_BUDGET"; maxAffordable: number }
  | { ok: false; error: "PURCHASE_NOT_FOUND" };

const UNIQUE_VIOLATION = "23505";

/**
 * Assignment logic (design §6, spec §4.1/§4.2). No candidate-match
 * precondition (off-list allowed, D-C) and no lock check (auction is not
 * gated by lock, spec §5 last bullet).
 */
export async function assignPurchase(
  slot: SlotCode,
  playerName: string,
  finalPrice: number
): Promise<PurchaseResult> {
  const client = getSupabaseServerClient();

  const [purchasesRes, configRes] = await Promise.all([
    client.from("purchases").select("slot, final_price"),
    client.from("app_config").select("initial_budget").eq("id", true).single(),
  ]);

  if (purchasesRes.error) {
    throw purchasesRes.error;
  }
  if (configRes.error) {
    throw configRes.error;
  }

  const purchases = purchasesRes.data as { slot: SlotCode; final_price: number }[];
  const initialBudget = (configRes.data as { initial_budget: number }).initial_budget;

  if (purchases.some((row) => row.slot === slot)) {
    return { ok: false, error: "SLOT_FILLED" };
  }

  const spent = purchases.reduce((sum, row) => sum + row.final_price, 0);
  const remaining = initialBudget - spent;
  const openSlotsCount = TOTAL_SLOTS - purchases.length;
  const reserved = openSlotsCount - 1;
  const maxAffordable = remaining - reserved;

  if (finalPrice > maxAffordable) {
    return { ok: false, error: "PRICE_EXCEEDS_BUDGET", maxAffordable };
  }

  const { error } = await client
    .from("purchases")
    .insert({ slot, player_name: playerName, final_price: finalPrice });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "SLOT_FILLED" };
    }
    throw error;
  }

  return { ok: true, remainingBudget: remaining - finalPrice };
}

/**
 * Edit logic for an existing assignment (Jabu-only). Excludes the slot's own
 * current price from the spent total since it stays filled before and after
 * the edit — it was never an "open" slot, so no -1 reservation adjustment
 * like assignPurchase's fresh-assignment case.
 */
export async function updatePurchase(
  slot: SlotCode,
  playerName: string,
  finalPrice: number
): Promise<PurchaseResult> {
  const client = getSupabaseServerClient();

  const [purchasesRes, configRes] = await Promise.all([
    client.from("purchases").select("slot, final_price"),
    client.from("app_config").select("initial_budget").eq("id", true).single(),
  ]);

  if (purchasesRes.error) {
    throw purchasesRes.error;
  }
  if (configRes.error) {
    throw configRes.error;
  }

  const purchases = purchasesRes.data as { slot: SlotCode; final_price: number }[];
  const initialBudget = (configRes.data as { initial_budget: number }).initial_budget;

  if (!purchases.some((row) => row.slot === slot)) {
    return { ok: false, error: "PURCHASE_NOT_FOUND" };
  }

  const otherPurchases = purchases.filter((row) => row.slot !== slot);
  const remaining =
    initialBudget - otherPurchases.reduce((sum, row) => sum + row.final_price, 0);
  const reserved = TOTAL_SLOTS - purchases.length;
  const maxAffordable = remaining - reserved;

  if (finalPrice > maxAffordable) {
    return { ok: false, error: "PRICE_EXCEEDS_BUDGET", maxAffordable };
  }

  const { error } = await client
    .from("purchases")
    .update({ player_name: playerName, final_price: finalPrice })
    .eq("slot", slot);

  if (error) {
    throw error;
  }

  return { ok: true, remainingBudget: remaining - finalPrice };
}

/**
 * Delete logic for an existing assignment (Jabu-only). Freeing a slot never
 * decreases available budget, so no budget check is needed.
 */
export async function deletePurchase(
  slot: SlotCode
): Promise<{ ok: true } | { ok: false; error: "PURCHASE_NOT_FOUND" }> {
  const client = getSupabaseServerClient();

  const { data, error } = await client.from("purchases").delete().eq("slot", slot).select();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return { ok: false, error: "PURCHASE_NOT_FOUND" };
  }

  return { ok: true };
}

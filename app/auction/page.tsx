import { ROLE } from "@/lib/types";
import { requireRole } from "@/lib/auth/guard";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { normalizeName } from "@/lib/normalize";
import { SLOT_CODES, roleGroupOf, type RoleGroup, type SlotCode } from "@/lib/slots";
import { recommendMiglioCallName } from "@/lib/auction/recommend-call";
import AuctionConsole, { type AutocompleteEntry } from "./auction-console";
import RosterSidebar, { type RosterPurchase } from "./roster-sidebar";
import PurchaseManager, { type ManagedPurchase } from "./purchase-manager";
import LogoutButton from "../logout-button";

interface CandidateDbRow {
  slot: SlotCode;
  player_name: string;
  priority: number;
}

interface PurchaseDbRow {
  slot: SlotCode;
  player_name: string;
  final_price: number;
}

export default async function AuctionPage() {
  await requireRole(ROLE.JABU);
  const client = getSupabaseServerClient();

  const [candidatesRes, purchasesRes, configRes] = await Promise.all([
    // Explicit safe select — max_price is never fetched here; priority stays server-only.
    client.from("candidates").select("slot, player_name, priority"),
    client
      .from("purchases")
      .select("slot, player_name, final_price")
      .order("purchased_at", { ascending: false }),
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

  const candidates = candidatesRes.data as CandidateDbRow[];
  const purchases = purchasesRes.data as PurchaseDbRow[];
  const config = configRes.data as { initial_budget: number };

  const filledSlots = new Set(purchases.map((row) => row.slot));
  const openSlotCodes = SLOT_CODES.filter((slot) => !filledSlots.has(slot));
  const miglioCallName = recommendMiglioCallName(
    openSlotCodes,
    candidates.map((row) => ({
      slot: row.slot,
      playerName: row.player_name,
      priority: row.priority,
    }))
  );

  // Derive the client-safe autocomplete index: one entry per distinct
  // normalized name, display casing = first-seen original.
  const byNormalizedName = new Map<
    string,
    { playerName: string; roleGroups: Set<RoleGroup>; openSlots: SlotCode[] }
  >();
  for (const row of candidates) {
    const key = normalizeName(row.player_name);
    let entry = byNormalizedName.get(key);
    if (!entry) {
      entry = { playerName: row.player_name, roleGroups: new Set(), openSlots: [] };
      byNormalizedName.set(key, entry);
    }
    entry.roleGroups.add(roleGroupOf(row.slot));
    if (!filledSlots.has(row.slot)) {
      entry.openSlots.push(row.slot);
    }
  }

  const autocompleteIndex: AutocompleteEntry[] = Array.from(byNormalizedName.values()).map(
    (entry) => ({
      playerName: entry.playerName,
      roleGroups: Array.from(entry.roleGroups),
      openSlots: entry.openSlots,
    })
  );

  const rosterPurchases: RosterPurchase[] = purchases.map((row) => ({
    slot: row.slot,
    playerName: row.player_name,
    finalPrice: row.final_price,
  }));

  const historyRows: ManagedPurchase[] = purchases.map((row) => ({
    playerName: row.player_name,
    slot: row.slot,
    finalPrice: row.final_price,
  }));

  const spent = purchases.reduce((sum, row) => sum + row.final_price, 0);
  const remaining = config.initial_budget - spent;

  return (
    <>
      <main className="ds-shell ds-bento-grid ds-auction-main-with-footer">
        <section className="ds-stack">
          <div className="flex items-center justify-end">
            <LogoutButton />
          </div>
          <AuctionConsole
            autocompleteIndex={autocompleteIndex}
            openSlots={openSlotCodes}
            miglioCallName={miglioCallName}
          />
        </section>
        <aside className="ds-stack">
          <RosterSidebar
            purchases={rosterPurchases}
            initialBudget={config.initial_budget}
            spent={spent}
            remaining={remaining}
          />
        </aside>
      </main>
      <footer className="ds-purchase-footer">
        <PurchaseManager rows={historyRows} />
      </footer>
    </>
  );
}

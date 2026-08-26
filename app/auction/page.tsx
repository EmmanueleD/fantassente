import { ROLE } from "@/lib/types";
import { requireRole } from "@/lib/auth/guard";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { normalizeName } from "@/lib/normalize";
import { SLOT_CODES, roleGroupOf, type RoleGroup, type SlotCode } from "@/lib/slots";
import AuctionConsole, { type AutocompleteEntry } from "./auction-console";
import RosterSidebar, { type RosterPurchase } from "./roster-sidebar";
import PurchaseHistory, { type PurchaseHistoryRow } from "./purchase-history";
import LogoutButton from "../logout-button";

interface CandidateDbRow {
  slot: SlotCode;
  player_name: string;
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
    // Explicit two-column select — max_price/priority are never fetched here (design D-G, spec §7).
    client.from("candidates").select("slot, player_name"),
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

  const historyRows: PurchaseHistoryRow[] = purchases.map((row) => ({
    playerName: row.player_name,
    slot: row.slot,
    finalPrice: row.final_price,
  }));

  const spent = purchases.reduce((sum, row) => sum + row.final_price, 0);
  const remaining = config.initial_budget - spent;

  return (
    <main className="grid min-h-screen grid-cols-1 gap-6 bg-slate-900 p-6 text-white lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-end">
          <LogoutButton />
        </div>
        <AuctionConsole autocompleteIndex={autocompleteIndex} openSlots={openSlotCodes} />
      </section>
      <aside className="flex flex-col gap-6">
        <RosterSidebar
          purchases={rosterPurchases}
          initialBudget={config.initial_budget}
          spent={spent}
          remaining={remaining}
        />
        <PurchaseHistory rows={historyRows} />
      </aside>
    </main>
  );
}

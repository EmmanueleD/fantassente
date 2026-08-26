import { ROLE } from "@/lib/types";
import { requireRole } from "@/lib/auth/guard";
import { getSetupData } from "@/lib/setup/setup-service";
import { SLOT_CODES, roleGroupOf, type SlotCode, type RoleGroup } from "@/lib/slots";
import SlotEditor from "./slot-editor";
import BudgetSummary from "./budget-summary";
import SetupTabs from "./setup-tabs";
import LogoutButton from "../logout-button";
import RosterSidebar, { type RosterPurchase } from "@/app/auction/roster-sidebar";
import PurchaseHistory, { type PurchaseHistoryRow } from "@/app/auction/purchase-history";

const GROUP_LABELS: Record<RoleGroup, string> = {
  P: "Portieri",
  D: "Difensori",
  C: "Centrocampisti",
  A: "Attaccanti",
};

export default async function SetupPage() {
  await requireRole(ROLE.MIGLIO);
  const data = await getSetupData();
  const filled = new Set(data.filledSlots);

  const groups: Record<RoleGroup, SlotCode[]> = { P: [], D: [], C: [], A: [] };
  for (const slot of SLOT_CODES) {
    groups[roleGroupOf(slot)].push(slot);
  }

  const strategyContent = (
    <>
      <BudgetSummary initialBudget={data.initialBudget} projectedRemainingBudget={data.projectedRemainingBudget} />
      <div className="mt-8 flex flex-col gap-8">
        {Object.entries(groups).map(([group, slots]) => (
          <section key={group}>
            <h2 className="mb-3 text-xl font-semibold">{GROUP_LABELS[group as RoleGroup]}</h2>
            <div className="flex flex-col gap-4">
              {slots.map((slot) => (
                <SlotEditor
                  key={slot}
                  slot={slot}
                  filled={filled.has(slot)}
                  candidates={data.candidates
                    .filter((candidate) => candidate.slot === slot)
                    .sort((a, b) => a.priority - b.priority)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );

  const rosterPurchases: RosterPurchase[] = data.purchases.map((row) => ({
    slot: row.slot,
    playerName: row.playerName,
    finalPrice: row.finalPrice,
  }));
  const historyRows: PurchaseHistoryRow[] = data.purchases.map((row) => ({
    playerName: row.playerName,
    slot: row.slot,
    finalPrice: row.finalPrice,
  }));

  const teamContent = (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="lg:w-96">
        <RosterSidebar
          purchases={rosterPurchases}
          initialBudget={data.initialBudget}
          spent={data.actualSpent}
          remaining={data.actualRemainingBudget}
        />
      </div>
      <div className="flex-1">
        <PurchaseHistory rows={historyRows} />
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Setup strategia — Miglio</h1>
        <LogoutButton />
      </div>
      <SetupTabs strategyContent={strategyContent} teamContent={teamContent} />
    </main>
  );
}

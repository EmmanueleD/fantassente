import { ROLE } from "@/lib/types";
import { requireRole } from "@/lib/auth/guard";
import { getSetupData } from "@/lib/setup/setup-service";
import { SLOT_CODES, roleGroupOf, type SlotCode, type RoleGroup } from "@/lib/slots";
import SlotEditor from "./slot-editor";
import SetupTabs from "./setup-tabs";
import LogoutButton from "../logout-button";
import RosterSidebar, { type RosterPurchase } from "@/app/auction/roster-sidebar";
import PurchaseHistory, { type PurchaseHistoryRow } from "@/app/auction/purchase-history";
import { RoleChip } from "@/app/ui/role-chip";

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
      <div className="flex flex-col gap-8">
        {Object.entries(groups).map(([group, slots]) => (
          <section key={group}>
            <div className="sb-rail">
              <RoleChip code={group as RoleGroup} variant="compact" />
              <span className="sb-rail-label">{GROUP_LABELS[group as RoleGroup]}</span>
              <span className="sb-digit ml-auto text-xs text-night-500">{slots.length}</span>
            </div>
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
    <main className="sb-stage min-h-screen p-6 text-chalk-200">
      <div className="sb-topbar mb-6">
        <div className="flex items-baseline gap-3">
          <span className="font-digit text-lg tracking-board text-faro-300">FANTASSENTE</span>
          <span className="font-display text-xs uppercase tracking-board text-night-500">
            Setup strategia
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="sb-plate--faro">Miglio</span>
          <LogoutButton />
        </div>
      </div>
      <SetupTabs strategyContent={strategyContent} teamContent={teamContent} />
    </main>
  );
}

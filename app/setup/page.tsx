import { ROLE } from "@/lib/types";
import { requireRole } from "@/lib/auth/guard";
import { getSetupData } from "@/lib/setup/setup-service";
import { SLOT_CODES, roleGroupOf, type SlotCode, type RoleGroup } from "@/lib/slots";
import SlotEditor from "./slot-editor";
import BudgetLockPanel from "./budget-lock-panel";

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

  return (
    <main className="min-h-screen bg-slate-900 p-6 text-white">
      <h1 className="mb-6 text-3xl font-bold">Setup strategia — Miglio</h1>
      <BudgetLockPanel initialBudget={data.initialBudget} strategyLocked={data.strategyLocked} />
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
                  strategyLocked={data.strategyLocked}
                  candidates={data.candidates
                    .filter((candidate) => candidate.slot === slot)
                    .sort((a, b) => a.priority - b.priority)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

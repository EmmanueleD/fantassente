import { SLOT_CODES, roleGroupOf, type RoleGroup, type SlotCode } from "@/lib/slots";

export interface RosterPurchase {
  slot: SlotCode;
  playerName: string;
  finalPrice: number;
}

interface RosterSidebarProps {
  purchases: RosterPurchase[];
  initialBudget: number;
  spent: number;
  remaining: number;
}

const GROUP_LABELS: Record<RoleGroup, string> = {
  P: "Portieri",
  D: "Difensori",
  C: "Centrocampisti",
  A: "Attaccanti",
};

export default function RosterSidebar({ purchases, initialBudget, spent, remaining }: RosterSidebarProps) {
  const bySlot = new Map(purchases.map((row) => [row.slot, row]));
  const groups: Record<RoleGroup, SlotCode[]> = { P: [], D: [], C: [], A: [] };
  for (const slot of SLOT_CODES) {
    groups[roleGroupOf(slot)].push(slot);
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <div className="mb-4">
        <p className="text-sm text-slate-400">
          Speso {spent} / {initialBudget}
        </p>
        <p className="text-3xl font-bold">Residuo {remaining}</p>
      </div>
      <div className="flex flex-col gap-4">
        {Object.entries(groups).map(([group, slots]) => (
          <div key={group}>
            <h3 className="mb-1 text-sm font-semibold text-slate-400">{GROUP_LABELS[group as RoleGroup]}</h3>
            <ul className="flex flex-col gap-0.5 text-sm">
              {slots.map((slot) => {
                const row = bySlot.get(slot);
                return (
                  <li key={slot} className="flex justify-between border-t border-slate-700 py-1">
                    <span className="text-slate-400">{slot}</span>
                    {row ? (
                      <span>
                        {row.playerName} · {row.finalPrice}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

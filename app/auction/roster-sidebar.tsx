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
    <div className="ds-card ds-card-pad">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase leading-[1.2] text-[var(--color-neutral-900)]">
            Speso {spent} / {initialBudget}
          </p>
          <p className="text-[30px] font-medium leading-none text-[var(--color-neutral-900)]">
            Residuo {remaining}
          </p>
        </div>
        <div className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-[14px] text-[var(--color-text)] shadow-[var(--shadow-lg)]">
          rosa
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {Object.entries(groups).map(([group, slots]) => (
          <div key={group}>
            <h3 className="mb-2 text-[12px] font-bold uppercase leading-[1.2] text-[var(--color-neutral-900)]">
              {GROUP_LABELS[group as RoleGroup]}
            </h3>
            <ul className="flex flex-col gap-1 text-[14px]">
              {slots.map((slot) => {
                const row = bySlot.get(slot);
                return (
                  <li
                    key={slot}
                    className="flex justify-between gap-2 rounded-[16px] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
                  >
                    <span className="text-[var(--color-neutral-700)]">{slot}</span>
                    {row ? (
                      <span className="text-right">
                        {row.playerName} · {row.finalPrice}
                      </span>
                    ) : (
                      <span className="text-[var(--color-neutral-700)]">—</span>
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

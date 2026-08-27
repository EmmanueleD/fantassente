import { SLOT_CODES, roleGroupOf, type RoleGroup, type SlotCode } from "@/lib/slots";
import { RoleChip } from "@/app/ui/role-chip";

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
    <div className="sb-bezel">
      <div className="sb-face sb-panel">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-xs uppercase tracking-board text-night-500">Speso</p>
            <p className="sb-jumbo text-xl text-chalk-050">
              {spent} <span className="text-night-500">/ {initialBudget}</span>
            </p>
          </div>
          <div className="relative overflow-hidden rounded-sm px-2 py-1 text-right">
            <div className="led-grid absolute inset-0 opacity-10" />
            <p className="relative font-display text-xs uppercase tracking-board text-night-500">Residuo</p>
            <p className="sb-jumbo relative text-5xl text-faro-300">{remaining}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {Object.entries(groups).map(([group, slots]) => (
            <div key={group}>
              <div className="sb-rail">
                <RoleChip code={group as RoleGroup} variant="compact" />
                <span className="sb-rail-label">{GROUP_LABELS[group as RoleGroup]}</span>
              </div>
              <ul className="flex flex-col gap-0.5 text-sm">
                {slots.map((slot, index) => {
                  const row = bySlot.get(slot);
                  return (
                    <li
                      key={slot}
                      className="animate-sb-settle flex items-center justify-between gap-2 border-t border-night-700 py-2"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <span className="flex items-center gap-2">
                        <RoleChip code={slot} variant="compact" />
                        {row ? (
                          <span className="font-display text-chalk-200">{row.playerName}</span>
                        ) : (
                          <span className="font-display text-night-500">—</span>
                        )}
                      </span>
                      {row ? (
                        <span className="sb-digit w-16 text-right text-chalk-050">{row.finalPrice}</span>
                      ) : (
                        <span className="sb-digit w-16 text-right text-night-500">—</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

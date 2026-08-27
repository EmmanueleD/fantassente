import type { SlotCode } from "@/lib/slots";
import { RoleChip } from "@/app/ui/role-chip";

export interface PurchaseHistoryRow {
  playerName: string;
  slot: SlotCode;
  finalPrice: number;
}

interface PurchaseHistoryProps {
  rows: PurchaseHistoryRow[];
}

export default function PurchaseHistory({ rows }: PurchaseHistoryProps) {
  return (
    <div className="sb-bezel animate-sb-settle">
      <div className="sb-face sb-panel">
        <div className="sb-rail">
          <span className="sb-rail-label">Storico acquisti</span>
        </div>
        {rows.length === 0 ? (
          <p className="relative overflow-hidden rounded-sm px-3 py-2 font-display text-sm text-night-500">
            <span className="led-grid absolute inset-0 opacity-10" />
            <span className="relative">Nessun acquisto ancora.</span>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-display uppercase tracking-board text-night-500">
                  <th className="pb-2 font-semibold">Giocatore</th>
                  <th className="pb-2 font-semibold">Slot</th>
                  <th className="pb-2 text-right font-semibold">Prezzo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.slot}-${index}`}
                    className={`border-t border-night-700 ${index % 2 === 1 ? "bg-night-850/40" : ""}`}
                  >
                    <td className="py-2 font-display text-chalk-200">{row.playerName}</td>
                    <td className="py-2">
                      <RoleChip code={row.slot} variant="compact" />
                    </td>
                    <td className="sb-digit w-20 py-2 text-right text-chalk-050">{row.finalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

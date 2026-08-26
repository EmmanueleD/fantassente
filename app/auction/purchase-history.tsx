import type { SlotCode } from "@/lib/slots";

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
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-2 font-bold">Storico acquisti</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Nessun acquisto ancora.</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th>Giocatore</th>
              <th>Slot</th>
              <th>Prezzo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.slot}-${index}`} className="border-t border-slate-700">
                <td className="py-1">{row.playerName}</td>
                <td>{row.slot}</td>
                <td>{row.finalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

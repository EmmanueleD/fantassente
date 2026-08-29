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
    <div className="ds-card-dark ds-card-pad">
      <h3 className="mb-4 text-[20px] font-semibold leading-[1.5]">Storico acquisti</h3>
      {rows.length === 0 ? (
        <p className="ds-muted">Nessun acquisto ancora.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Giocatore</th>
                <th>Slot</th>
                <th>Prezzo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.slot}-${index}`}>
                  <td>{row.playerName}</td>
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

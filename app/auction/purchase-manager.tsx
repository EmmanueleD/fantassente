"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SlotCode } from "@/lib/slots";

export interface ManagedPurchase {
  playerName: string;
  slot: SlotCode;
  finalPrice: number;
}

export default function PurchaseManager({ rows }: { rows: ManagedPurchase[] }) {
  const router = useRouter();
  const [editingSlot, setEditingSlot] = useState<SlotCode | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function startEdit(row: ManagedPurchase) {
    setEditingSlot(row.slot);
    setEditName(row.playerName);
    setEditPrice(String(row.finalPrice));
    setError(null);
  }

  function cancelEdit() {
    setEditingSlot(null);
    setError(null);
  }

  async function saveEdit(slot: SlotCode) {
    const trimmedName = editName.trim();
    const price = Number(editPrice);
    if (trimmedName === "" || !Number.isInteger(price) || price <= 0) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, playerName: trimmedName, finalPrice: price }),
      });
      if (response.ok) {
        router.refresh();
        setEditingSlot(null);
        return;
      }
      const body = (await response.json().catch(() => null)) as
        | { error?: string; maxAffordable?: number }
        | null;
      if (body?.error === "PRICE_EXCEEDS_BUDGET") {
        setError(`PREZZO OLTRE IL BUDGET DISPONIBILE (max ${body.maxAffordable})`);
      } else if (body?.error === "PURCHASE_NOT_FOUND") {
        setError("ASSEGNAZIONE NON TROVATA");
      } else {
        setError("ERRORE NELLA MODIFICA");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(slot: SlotCode) {
    if (!window.confirm("Eliminare questa assegnazione? Lo slot tornerà libero.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot }),
      });
      if (response.ok) {
        router.refresh();
        return;
      }
      setError("ERRORE NELL'ELIMINAZIONE");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ds-card-dark ds-card-pad">
      <h3 className="mb-4 text-[20px] font-semibold leading-[1.5]">Gestione acquisti</h3>
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
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slot} className="align-top">
                  {editingSlot === row.slot ? (
                    <td colSpan={4}>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          className="ds-input-compact"
                        />
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(event) => setEditPrice(event.target.value)}
                          className="ds-input-compact w-20"
                        />
                        <span className="ds-muted">({row.slot})</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void saveEdit(row.slot)}
                          className="ds-button-primary"
                        >
                          Salva
                        </button>
                        <button type="button" onClick={cancelEdit} className="ds-button-tertiary">
                          annulla
                        </button>
                      </div>
                      {error && <p className="mt-2 text-[12px] font-bold text-[var(--color-warning)]">{error}</p>}
                    </td>
                  ) : (
                    <>
                      <td>{row.playerName}</td>
                      <td>{row.slot}</td>
                      <td>{row.finalPrice}</td>
                      <td className="whitespace-nowrap">
                        <button type="button" onClick={() => startEdit(row)} className="ds-button-secondary mr-2">
                          modifica
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete(row.slot)}
                          className="ds-button-danger"
                        >
                          elimina
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

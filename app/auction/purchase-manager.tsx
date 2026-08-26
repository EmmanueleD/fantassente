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
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slot} className="border-t border-slate-700 align-top">
                  {editingSlot === row.slot ? (
                    <td colSpan={4} className="py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          className="rounded bg-slate-700 px-2 py-1"
                        />
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(event) => setEditPrice(event.target.value)}
                          className="w-20 rounded bg-slate-700 px-2 py-1"
                        />
                        <span className="text-slate-400">({row.slot})</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void saveEdit(row.slot)}
                          className="rounded bg-green-600 px-3 py-1 font-bold disabled:opacity-40"
                        >
                          Salva
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded bg-slate-600 px-3 py-1"
                        >
                          annulla
                        </button>
                      </div>
                      {error && <p className="mt-1 text-xs font-bold text-red-400">{error}</p>}
                    </td>
                  ) : (
                    <>
                      <td className="py-1">{row.playerName}</td>
                      <td>{row.slot}</td>
                      <td>{row.finalPrice}</td>
                      <td className="whitespace-nowrap py-1 text-xs">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="mr-2 text-blue-400 underline"
                        >
                          modifica
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete(row.slot)}
                          className="text-red-400 underline disabled:opacity-40"
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

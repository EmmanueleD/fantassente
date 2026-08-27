"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SlotCode } from "@/lib/slots";
import { RoleChip } from "@/app/ui/role-chip";
import { cn } from "@/lib/ui/cn";

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
  const [ackSlot, setAckSlot] = useState<SlotCode | null>(null);

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
        setAckSlot(slot);
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
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.slot}
                    onAnimationEnd={() => {
                      if (ackSlot === row.slot) {
                        setAckSlot(null);
                      }
                    }}
                    className={cn(
                      "border-t border-night-700 align-top",
                      index % 2 === 1 && "bg-night-850/40",
                      ackSlot === row.slot && "animate-sb-ack",
                    )}
                  >
                    {editingSlot === row.slot ? (
                      <td colSpan={4} className="animate-sb-settle py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            className="sb-input w-auto flex-1 min-w-[10rem]"
                          />
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(event) => setEditPrice(event.target.value)}
                            className="sb-input sb-digit w-24 text-right"
                          />
                          <RoleChip code={row.slot} variant="compact" />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void saveEdit(row.slot)}
                            className="sb-btn sb-btn--via"
                          >
                            Salva
                          </button>
                          <button type="button" onClick={cancelEdit} className="sb-btn sb-btn--ghost">
                            annulla
                          </button>
                        </div>
                        {error && <p className="sb-alert mt-2 text-xs">{error}</p>}
                      </td>
                    ) : (
                      <>
                        <td className="py-2 font-display text-chalk-200">{row.playerName}</td>
                        <td className="py-2">
                          <RoleChip code={row.slot} variant="compact" />
                        </td>
                        <td className="sb-digit w-20 py-2 text-right text-chalk-050">{row.finalPrice}</td>
                        <td className="whitespace-nowrap py-2 text-right text-xs">
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="sb-btn sb-btn--ghost mr-2 min-h-11 px-3 py-1"
                          >
                            modifica
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDelete(row.slot)}
                            className="sb-btn sb-btn--siren min-h-11 px-3 py-1"
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
    </div>
  );
}

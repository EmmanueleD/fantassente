"use client";

import { useState, useTransition } from "react";
import type { SlotCode } from "@/lib/slots";
import {
  addCandidateAction,
  deleteCandidateAction,
  reorderCandidatesAction,
  updateCandidatePriceAction,
} from "./actions";

interface CandidateView {
  id: number;
  slot: SlotCode;
  playerName: string;
  maxPrice: number;
  priority: number;
}

interface SlotEditorProps {
  slot: SlotCode;
  filled: boolean;
  strategyLocked: boolean;
  candidates: CandidateView[];
}

export default function SlotEditor({ slot, filled, strategyLocked, candidates }: SlotEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState("");
  const [error, setError] = useState<string | null>(null);

  const disabled = strategyLocked || isPending;

  function handleAdd() {
    setError(null);
    const parsedPrice = Number(price);
    const parsedPriority = Number(priority);
    startTransition(async () => {
      const result = await addCandidateAction(slot, name, parsedPrice, parsedPriority);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setPrice("");
      setPriority("");
    });
  }

  function handlePriceChange(id: number, value: string) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateCandidatePriceAction(id, parsed);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function handleDelete(id: number) {
    setError(null);
    startTransition(async () => {
      const result = await deleteCandidateAction(id);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= candidates.length) {
      return;
    }
    const orderedIds = candidates.map((candidate) => candidate.id);
    const moved = orderedIds.splice(index, 1)[0];
    if (moved === undefined) {
      return;
    }
    orderedIds.splice(target, 0, moved);
    setError(null);
    startTransition(async () => {
      const result = await reorderCandidatesAction(slot, orderedIds);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-2 font-bold">
        {slot} {filled && <span className="ml-2 text-xs text-amber-400">OCCUPATO</span>}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400">
            <th>Priorità</th>
            <th>Giocatore</th>
            <th>Prezzo max</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate, index) => (
            <tr key={candidate.id} className="border-t border-slate-700">
              <td className="py-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => handleMove(index, -1)}
                  className="mr-1 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={disabled || index === candidates.length - 1}
                  onClick={() => handleMove(index, 1)}
                  className="disabled:opacity-30"
                >
                  ↓
                </button>
                <span className="ml-2">{candidate.priority}</span>
              </td>
              <td>{candidate.playerName}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  defaultValue={candidate.maxPrice}
                  disabled={disabled}
                  onBlur={(event) => handlePriceChange(candidate.id, event.target.value)}
                  className="w-20 rounded bg-slate-700 px-2 py-1 disabled:opacity-50"
                />
              </td>
              <td>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDelete(candidate.id)}
                  className="text-red-400 disabled:opacity-30"
                >
                  elimina
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex gap-2">
        <input
          placeholder="Giocatore"
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
          className="rounded bg-slate-700 px-2 py-1 disabled:opacity-50"
        />
        <input
          placeholder="Prezzo max"
          type="number"
          min={1}
          value={price}
          disabled={disabled}
          onChange={(event) => setPrice(event.target.value)}
          className="w-24 rounded bg-slate-700 px-2 py-1 disabled:opacity-50"
        />
        <input
          placeholder="Priorità"
          type="number"
          min={1}
          value={priority}
          disabled={disabled}
          onChange={(event) => setPriority(event.target.value)}
          className="w-20 rounded bg-slate-700 px-2 py-1 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled || name.trim() === "" || price === "" || priority === ""}
          onClick={handleAdd}
          className="rounded bg-green-600 px-3 py-1 font-bold disabled:opacity-30"
        >
          Aggiungi
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

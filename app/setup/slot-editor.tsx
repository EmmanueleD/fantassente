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
  candidates: CandidateView[];
}

export default function SlotEditor({ slot, filled, candidates }: SlotEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState("");
  const [error, setError] = useState<string | null>(null);

  const disabled = isPending;

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
    <div className="ds-card ds-card-pad">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-[30px] font-medium leading-none text-[var(--color-neutral-900)]">{slot}</h3>
        {filled && (
          <span className="rounded-full bg-[var(--color-warning)] px-4 py-2 text-[14px] font-bold text-[var(--color-neutral-900)]">
            OCCUPATO
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="ds-table text-[var(--color-neutral-900)]">
          <thead>
            <tr>
              <th className="!text-[var(--color-neutral-900)]">Priorità</th>
              <th className="!text-[var(--color-neutral-900)]">Giocatore</th>
              <th className="!text-[var(--color-neutral-900)]">Prezzo max</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate, index) => (
              <tr key={candidate.id}>
                <td>
                  <button
                    type="button"
                    disabled={disabled || index === 0}
                    onClick={() => handleMove(index, -1)}
                    className="ds-button-secondary mr-1"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={disabled || index === candidates.length - 1}
                    onClick={() => handleMove(index, 1)}
                    className="ds-button-secondary"
                  >
                    ↓
                  </button>
                  <span className="ml-2 font-bold">{candidate.priority}</span>
                </td>
                <td>{candidate.playerName}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    defaultValue={candidate.maxPrice}
                    disabled={disabled}
                    onBlur={(event) => handlePriceChange(candidate.id, event.target.value)}
                    className="ds-input-compact w-20"
                  />
                </td>
                <td>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDelete(candidate.id)}
                    className="ds-button-danger"
                  >
                    elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          placeholder="Giocatore"
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
          className="ds-input-compact"
        />
        <input
          placeholder="Prezzo max"
          type="number"
          min={1}
          value={price}
          disabled={disabled}
          onChange={(event) => setPrice(event.target.value)}
          className="ds-input-compact w-24"
        />
        <input
          placeholder="Priorità"
          type="number"
          min={1}
          value={priority}
          disabled={disabled}
          onChange={(event) => setPriority(event.target.value)}
          className="ds-input-compact w-20"
        />
        <button
          type="button"
          disabled={disabled || name.trim() === "" || price === "" || priority === ""}
          onClick={handleAdd}
          className="ds-button-primary"
        >
          Aggiungi
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] font-bold text-[var(--color-error)]">{error}</p>}
    </div>
  );
}

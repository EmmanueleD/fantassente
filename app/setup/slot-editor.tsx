"use client";

import { useEffect, useState, useTransition } from "react";
import type { SlotCode } from "@/lib/slots";
import { RoleChip } from "@/app/ui/role-chip";
import { NumberStepper } from "@/app/ui/number-stepper";
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

interface PriceStepperCellProps {
  maxPrice: number;
  disabled: boolean;
  onCommit: (value: string) => void;
}

/**
 * Local controlled stepper for a single candidate row's max price. Mirrors
 * the prior uncontrolled defaultValue+onBlur behavior exactly: the server
 * action fires on blur (typing) or immediately after a stepper click, never
 * on every keystroke. Resyncs from props when the server-confirmed value
 * changes (e.g. after a successful commit elsewhere).
 */
function PriceStepperCell({ maxPrice, disabled, onCommit }: PriceStepperCellProps) {
  const [value, setValue] = useState(String(maxPrice));

  useEffect(() => {
    setValue(String(maxPrice));
  }, [maxPrice]);

  return (
    <NumberStepper
      aria-label="Prezzo max"
      min={1}
      value={value}
      disabled={disabled}
      onChange={setValue}
      onCommit={onCommit}
      className="text-right"
    />
  );
}

export default function SlotEditor({ slot, filled, candidates }: SlotEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Presentational-only: drives a single calm-register ack pulse on the panel
  // after a successful CRUD action, mirroring the ackSlot pattern used in
  // app/auction/purchase-manager.tsx. Feeds no request/computation.
  const [ack, setAck] = useState(false);

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
      setAck(true);
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
        return;
      }
      setAck(true);
    });
  }

  function handleDelete(id: number) {
    setError(null);
    startTransition(async () => {
      const result = await deleteCandidateAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAck(true);
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
        return;
      }
      setAck(true);
    });
  }

  return (
    <div className="sb-bezel">
      <div
        className={`sb-face sb-panel ${ack ? "animate-sb-ack" : ""}`}
        onAnimationEnd={() => setAck(false)}
      >
        <div className="mb-2 flex items-center gap-2">
          <RoleChip code={slot} variant="compact" />
          {filled && <span className="sb-plate--faro">Occupato</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="text-left font-display uppercase tracking-board text-night-500">
                <th className="pb-2 font-semibold">Priorità</th>
                <th className="pb-2 font-semibold">Giocatore</th>
                <th className="pb-2 text-right font-semibold">Prezzo max</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate, index) => (
                <tr
                  key={candidate.id}
                  className={`border-t border-night-700 ${index % 2 === 1 ? "bg-night-850/40" : ""}`}
                >
                  <td className="py-2">
                    <button
                      type="button"
                      disabled={disabled || index === 0}
                      onClick={() => handleMove(index, -1)}
                      className="sb-btn sb-btn--ghost mr-1 min-h-11 min-w-11 px-2 py-1 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={disabled || index === candidates.length - 1}
                      onClick={() => handleMove(index, 1)}
                      className="sb-btn sb-btn--ghost min-h-11 min-w-11 px-2 py-1 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <span className="sb-digit ml-2 text-chalk-050">{candidate.priority}</span>
                  </td>
                  <td className="font-display text-chalk-200">{candidate.playerName}</td>
                  <td>
                    <PriceStepperCell
                      maxPrice={candidate.maxPrice}
                      disabled={disabled}
                      onCommit={(value) => handlePriceChange(candidate.id, value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleDelete(candidate.id)}
                      className="sb-btn sb-btn--siren min-h-11 px-3 py-1 text-xs disabled:opacity-30"
                    >
                      elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            placeholder="Giocatore"
            value={name}
            disabled={disabled}
            onChange={(event) => setName(event.target.value)}
            className="sb-input disabled:opacity-50"
          />
          <NumberStepper
            aria-label="Prezzo max"
            placeholder="Prezzo max"
            min={1}
            value={price}
            disabled={disabled}
            onChange={setPrice}
            className="text-right"
          />
          <NumberStepper
            aria-label="Priorità"
            placeholder="Priorità"
            min={1}
            value={priority}
            disabled={disabled}
            onChange={setPriority}
            className="text-right"
          />
          <button
            type="button"
            disabled={disabled || name.trim() === "" || price === "" || priority === ""}
            onClick={handleAdd}
            className="sb-btn sb-btn--via disabled:opacity-30"
          >
            Aggiungi
          </button>
        </div>
        {error && <p className="sb-alert animate-sb-settle mt-2 text-xs">{error}</p>}
      </div>
    </div>
  );
}

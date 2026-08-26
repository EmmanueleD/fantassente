"use client";

import { useState, useTransition } from "react";
import { lockStrategyAction, setInitialBudgetAction } from "./actions";

interface BudgetLockPanelProps {
  initialBudget: number;
  strategyLocked: boolean;
}

export default function BudgetLockPanel({ initialBudget, strategyLocked }: BudgetLockPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [budget, setBudget] = useState(String(initialBudget));
  const [error, setError] = useState<string | null>(null);

  const disabled = strategyLocked || isPending;

  function handleSaveBudget() {
    setError(null);
    const parsed = Number(budget);
    startTransition(async () => {
      const result = await setInitialBudgetAction(parsed);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function handleLock() {
    // One-way, irreversible action (spec §5) — require an explicit confirm step.
    if (!window.confirm("Bloccare la strategia? L'operazione è irreversibile.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await lockStrategyAction();
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
      <label className="flex items-center gap-2">
        Budget iniziale
        <input
          type="number"
          min={1}
          value={budget}
          disabled={disabled}
          onChange={(event) => setBudget(event.target.value)}
          className="w-24 rounded bg-slate-700 px-2 py-1 disabled:opacity-50"
        />
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={handleSaveBudget}
        className="rounded bg-blue-600 px-3 py-1 font-bold disabled:opacity-30"
      >
        Salva budget
      </button>
      <button
        type="button"
        disabled={isPending || strategyLocked}
        onClick={handleLock}
        className="rounded bg-red-600 px-3 py-1 font-bold disabled:opacity-30"
      >
        {strategyLocked ? "STRATEGIA BLOCCATA" : "BLOCCA STRATEGIA"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

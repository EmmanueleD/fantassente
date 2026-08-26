"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeName } from "@/lib/normalize";
import type { BidStatus } from "@/lib/types";
import type { RoleGroup, SlotCode } from "@/lib/slots";

export interface AutocompleteEntry {
  playerName: string;
  roleGroups: RoleGroup[];
  openSlots: SlotCode[];
}

interface AuctionConsoleProps {
  autocompleteIndex: AutocompleteEntry[];
  openSlots: SlotCode[];
}

interface Verdict {
  status: BidStatus;
  nextBid: number | null;
}

const VERDICT_STYLE: Record<BidStatus, string> = {
  ACTIVE: "bg-green-600 text-white",
  OUT: "bg-red-600 text-white",
  NOT_INTERESTED: "bg-slate-600 text-slate-100",
  SLOT_FULL: "bg-slate-700 text-slate-300",
};

function verdictLabel(verdict: Verdict): string {
  switch (verdict.status) {
    case "ACTIVE":
      return `MIGLIO RILANCIA A ${verdict.nextBid}`;
    case "OUT":
      return "MIGLIO PASSA";
    case "NOT_INTERESTED":
      return "NON INTERESSATO";
    case "SLOT_FULL":
      return "SLOT GIÀ OCCUPATO";
    default:
      return "—";
  }
}

export default function AuctionConsole({ autocompleteIndex, openSlots }: AuctionConsoleProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bidInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [selected, setSelected] = useState<AutocompleteEntry | null>(null);
  const [pinnedSlot, setPinnedSlot] = useState<SlotCode | null>(null);
  const [bidValue, setBidValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [checking, setChecking] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPrice, setAssignPrice] = useState("");
  const [assignSlot, setAssignSlot] = useState<SlotCode | "">("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualSlot, setManualSlot] = useState<SlotCode | "">("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  function resetManualPanel() {
    setManualOpen(false);
    setManualName("");
    setManualSlot("");
    setManualPrice("");
    setManualError(null);
  }

  async function handleManualAssign() {
    const trimmedName = manualName.trim();
    if (trimmedName === "" || manualSlot === "") {
      return;
    }
    const finalPrice = Number(manualPrice);
    if (!Number.isInteger(finalPrice) || finalPrice <= 0) {
      return;
    }
    setManualSubmitting(true);
    setManualError(null);
    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot: manualSlot,
          playerName: trimmedName,
          finalPrice,
        }),
      });
      if (response.ok) {
        router.refresh();
        resetManualPanel();
        return;
      }
      const body = (await response.json().catch(() => null)) as
        | { error?: string; maxAffordable?: number }
        | null;
      if (body?.error === "SLOT_FILLED") {
        setManualError("SLOT GIÀ OCCUPATO");
      } else if (body?.error === "PRICE_EXCEEDS_BUDGET") {
        setManualError(`PREZZO OLTRE IL BUDGET DISPONIBILE (max ${body.maxAffordable})`);
      } else {
        setManualError("ERRORE NELL'ASSEGNAZIONE");
      }
    } finally {
      setManualSubmitting(false);
    }
  }

  const matches = useMemo(() => {
    const target = normalizeName(query);
    if (target === "") {
      return [];
    }
    return autocompleteIndex.filter((entry) => normalizeName(entry.playerName).includes(target));
  }, [query, autocompleteIndex]);

  function resetToSearch() {
    setQuery("");
    setSelected(null);
    setPinnedSlot(null);
    setBidValue("");
    setVerdict(null);
    setAssignOpen(false);
    setAssignPrice("");
    setAssignSlot("");
    setAssignError(null);
    setHighlightIndex(0);
    searchInputRef.current?.focus();
  }

  function selectEntry(entry: AutocompleteEntry) {
    setSelected(entry);
    setQuery("");
    setPinnedSlot(entry.openSlots.length === 1 ? entry.openSlots[0]! : null);
    setVerdict(null);
    setHighlightIndex(0);
    bidInputRef.current?.focus();
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (matches.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) => (index + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((index) => (index - 1 + matches.length) % matches.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const entry = matches[highlightIndex];
      if (entry) {
        selectEntry(entry);
      }
    } else if (event.key === "Escape") {
      setQuery("");
    }
  }

  async function handleCheck() {
    if (!selected) {
      return;
    }
    const proposedBid = Number(bidValue);
    if (!Number.isInteger(proposedBid) || proposedBid <= 0) {
      return;
    }
    setChecking(true);
    try {
      const response = await fetch("/api/bid/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: selected.playerName,
          proposedBid,
          slot: pinnedSlot,
        }),
      });
      if (!response.ok) {
        setVerdict(null);
        return;
      }
      const body = (await response.json()) as Verdict;
      setVerdict(body);
      if (body.status === "ACTIVE" && body.nextBid !== null) {
        setAssignPrice(String(body.nextBid));
      }
    } finally {
      setChecking(false);
    }
  }

  function handleBidKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleCheck();
    }
  }

  function openAssignPanel() {
    if (selected && selected.openSlots.length === 1) {
      setAssignSlot(selected.openSlots[0]!);
    } else if (pinnedSlot) {
      setAssignSlot(pinnedSlot);
    } else {
      setAssignSlot("");
    }
    setAssignError(null);
    setAssignOpen(true);
  }

  async function handleAssign() {
    if (!selected || assignSlot === "") {
      return;
    }
    const finalPrice = Number(assignPrice);
    if (!Number.isInteger(finalPrice) || finalPrice <= 0) {
      return;
    }
    setAssigning(true);
    setAssignError(null);
    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot: assignSlot,
          playerName: selected.playerName,
          finalPrice,
        }),
      });
      if (response.ok) {
        router.refresh();
        resetToSearch();
        return;
      }
      const body = (await response.json().catch(() => null)) as
        | { error?: string; maxAffordable?: number }
        | null;
      if (body?.error === "SLOT_FILLED") {
        setAssignError("SLOT GIÀ OCCUPATO");
      } else if (body?.error === "PRICE_EXCEEDS_BUDGET") {
        setAssignError(`PREZZO OLTRE IL BUDGET DISPONIBILE (max ${body.maxAffordable})`);
      } else {
        setAssignError("ERRORE NELL'ASSEGNAZIONE");
      }
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-slate-700 p-3">
        <button
          type="button"
          onClick={() => (manualOpen ? resetManualPanel() : setManualOpen(true))}
          className="text-sm font-bold text-slate-300"
        >
          {manualOpen ? "chiudi assegnazione manuale" : "Assegnazione manuale"}
        </button>
        {manualOpen && (
          <div className="mt-3 flex flex-col gap-2">
            <input
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
              placeholder="Nome giocatore"
              className="rounded bg-slate-700 px-3 py-2 outline-none"
            />
            <select
              value={manualSlot}
              onChange={(event) => setManualSlot(event.target.value as SlotCode | "")}
              className="rounded bg-slate-700 px-3 py-2 outline-none"
            >
              <option value="">Slot...</option>
              {openSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="numeric"
              value={manualPrice}
              onChange={(event) => setManualPrice(event.target.value)}
              placeholder="Prezzo finale"
              className="rounded bg-slate-700 px-3 py-2 outline-none"
            />
            <button
              type="button"
              disabled={
                manualSubmitting || manualName.trim() === "" || manualSlot === "" || manualPrice === ""
              }
              onClick={() => void handleManualAssign()}
              className="rounded bg-green-600 px-4 py-2 font-bold disabled:opacity-40"
            >
              ASSEGNA MANUALMENTE
            </button>
            {manualError && <p className="text-sm font-bold text-red-400">{manualError}</p>}
          </div>
        )}
      </div>

      {!selected && (
        <div className="relative">
          <input
            ref={searchInputRef}
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlightIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Cerca giocatore..."
            className="w-full rounded-lg bg-slate-800 px-4 py-3 text-xl outline-none"
          />
          {matches.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-lg bg-slate-800 shadow-lg">
              {matches.map((entry, index) => (
                <li
                  key={entry.playerName}
                  onClick={() => selectEntry(entry)}
                  className={`cursor-pointer px-4 py-2 ${
                    index === highlightIndex ? "bg-slate-700" : ""
                  }`}
                >
                  {entry.playerName}{" "}
                  <span className="text-slate-400">
                    · {entry.roleGroups.join("/")} · slot: {entry.openSlots.join(", ") || "nessuno aperto"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3">
            <div>
              <p className="text-xl font-bold">{selected.playerName}</p>
              <p className="text-slate-400">
                {selected.roleGroups.join("/")} · slot aperti: {selected.openSlots.join(", ") || "nessuno"}
              </p>
            </div>
            <button type="button" onClick={resetToSearch} className="text-sm text-slate-400 underline">
              cambia
            </button>
          </div>

          {selected.openSlots.length > 1 && (
            <div className="flex gap-2">
              {selected.openSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setPinnedSlot(pinnedSlot === slot ? null : slot)}
                  className={`rounded px-3 py-1 text-sm ${
                    pinnedSlot === slot ? "bg-blue-600" : "bg-slate-700"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}

          <input
            ref={bidInputRef}
            type="number"
            inputMode="numeric"
            value={bidValue}
            onChange={(event) => setBidValue(event.target.value)}
            onKeyDown={handleBidKeyDown}
            placeholder="0"
            className="w-full rounded-lg bg-slate-800 px-4 py-3 text-5xl font-bold outline-none"
          />
          <button
            type="button"
            disabled={checking || bidValue === ""}
            onClick={() => void handleCheck()}
            className="rounded-lg bg-blue-600 px-4 py-3 text-xl font-bold disabled:opacity-40"
          >
            CONTROLLA
          </button>

          <div
            className={`flex min-h-[220px] items-center justify-center rounded-2xl px-6 text-center text-6xl font-black uppercase tracking-tight ${
              verdict ? VERDICT_STYLE[verdict.status] : "bg-slate-800"
            }`}
          >
            {verdict ? verdictLabel(verdict) : "—"}
          </div>

          {!assignOpen && (
            <button
              type="button"
              onClick={openAssignPanel}
              className="rounded-lg bg-amber-500 px-4 py-3 text-xl font-bold text-slate-900"
            >
              ASSEGNA A MIGLIO
            </button>
          )}

          {assignOpen && (
            <div className="flex flex-col gap-3 rounded-lg bg-slate-800 p-4">
              <div className="flex gap-2">
                {selected.openSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setAssignSlot(slot)}
                    className={`rounded px-3 py-1 text-sm ${
                      assignSlot === slot ? "bg-blue-600" : "bg-slate-700"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <input
                type="number"
                inputMode="numeric"
                value={assignPrice}
                onChange={(event) => setAssignPrice(event.target.value)}
                placeholder="Prezzo finale"
                className="rounded bg-slate-700 px-3 py-2 text-2xl font-bold outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={assigning || assignSlot === "" || assignPrice === ""}
                  onClick={() => void handleAssign()}
                  className="rounded bg-green-600 px-4 py-2 font-bold disabled:opacity-40"
                >
                  CONFERMA ASSEGNAZIONE
                </button>
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="rounded bg-slate-600 px-4 py-2"
                >
                  annulla
                </button>
              </div>
              {assignError && <p className="text-sm font-bold text-red-400">{assignError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

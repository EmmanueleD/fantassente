"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeName } from "@/lib/normalize";
import type { BidStatus } from "@/lib/types";
import type { RoleGroup, SlotCode } from "@/lib/slots";
import { RoleChip } from "@/app/ui/role-chip";
import { cn } from "@/lib/ui/cn";

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
  ACTIVE: "bg-via-700/25 text-via-300 animate-sb-flash",
  OUT: "bg-siren-700/30 text-siren-300 animate-sb-extinguish",
  NOT_INTERESTED: "bg-night-850 text-night-500 animate-sb-settle",
  SLOT_FULL: "bg-faro-700/20 text-faro-300 animate-sb-settle",
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
  const [verdictSeq, setVerdictSeq] = useState(0);
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
      setVerdictSeq((seq) => seq + 1);
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
      <div className="sb-bezel">
        <div className="sb-face sb-panel">
          <button
            type="button"
            onClick={() => (manualOpen ? resetManualPanel() : setManualOpen(true))}
            className="sb-btn sb-btn--ghost text-xs"
          >
            {manualOpen ? "chiudi assegnazione manuale" : "Assegnazione manuale"}
          </button>
          {manualOpen && (
            <div className="mt-3 flex animate-sb-settle flex-col gap-2">
              <input
                value={manualName}
                onChange={(event) => setManualName(event.target.value)}
                placeholder="Nome giocatore"
                className="sb-input"
              />
              <select
                value={manualSlot}
                onChange={(event) => setManualSlot(event.target.value as SlotCode | "")}
                className="sb-select"
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
                className="sb-input sb-digit text-right"
              />
              <button
                type="button"
                disabled={
                  manualSubmitting || manualName.trim() === "" || manualSlot === "" || manualPrice === ""
                }
                onClick={() => void handleManualAssign()}
                className="sb-btn sb-btn--via"
              >
                ASSEGNA MANUALMENTE
              </button>
              {manualError && <p className="sb-alert">{manualError}</p>}
            </div>
          )}
        </div>
      </div>

      {!selected && (
        <div className="sb-frame relative p-1">
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
            className="sb-input w-full text-2xl"
          />
          {matches.length > 0 && (
            <div className="sb-bezel absolute z-10 mt-1 w-full">
              <ul className="sb-face max-h-80 overflow-y-auto">
                {matches.map((entry, index) => (
                  <li
                    key={entry.playerName}
                    onClick={() => selectEntry(entry)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 border-b border-night-700 px-4 py-2 last:border-b-0",
                      index === highlightIndex && "border-l-2 border-l-faro-500 bg-night-850"
                    )}
                  >
                    <span className="font-display text-base font-semibold text-chalk-050">
                      {entry.playerName}
                    </span>
                    <span className="flex flex-wrap items-center justify-end gap-1">
                      {entry.roleGroups.map((group) => (
                        <RoleChip key={group} code={group} variant="compact" />
                      ))}
                      {entry.openSlots.length > 0 ? (
                        entry.openSlots.map((slot) => (
                          <RoleChip key={slot} code={slot} variant="compact" />
                        ))
                      ) : (
                        <span className="font-display text-xs uppercase tracking-board text-night-500">
                          nessuno aperto
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-4">
          <div className="sb-bezel">
            <div className="sb-face sb-panel flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-bold text-chalk-050">{selected.playerName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {selected.roleGroups.map((group) => (
                    <RoleChip key={group} code={group} variant="compact" />
                  ))}
                  {selected.openSlots.length > 0 ? (
                    selected.openSlots.map((slot) => (
                      <RoleChip key={slot} code={slot} variant="compact" />
                    ))
                  ) : (
                    <span className="font-display text-xs uppercase tracking-board text-night-500">
                      nessuno slot aperto
                    </span>
                  )}
                </div>
              </div>
              <button type="button" onClick={resetToSearch} className="sb-btn sb-btn--ghost text-xs">
                cambia
              </button>
            </div>
          </div>

          {selected.openSlots.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {selected.openSlots.map((slot) => (
                <RoleChip
                  key={slot}
                  code={slot}
                  selected={pinnedSlot === slot}
                  onClick={() => setPinnedSlot(pinnedSlot === slot ? null : slot)}
                />
              ))}
            </div>
          )}

          <div className="relative">
            <div className="led-grid pointer-events-none absolute inset-0 opacity-10" />
            <input
              ref={bidInputRef}
              type="number"
              inputMode="numeric"
              value={bidValue}
              onChange={(event) => setBidValue(event.target.value)}
              onKeyDown={handleBidKeyDown}
              placeholder="0"
              className="sb-input sb-input--jumbo relative bg-transparent text-6xl md:text-7xl"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              disabled={checking || bidValue === ""}
              onClick={() => void handleCheck()}
              className="sb-btn sb-btn--faro min-h-16 w-full text-2xl"
            >
              CONTROLLA
            </button>
            {checking && (
              <div className="absolute inset-x-2 bottom-1 h-0.5 animate-sb-settle bg-faro-500" />
            )}
          </div>

          <div
            key={verdictSeq}
            className={cn(
              "sb-bezel",
              verdict?.status === "ACTIVE" && "drop-shadow-via",
              verdict?.status === "OUT" && "drop-shadow-siren"
            )}
          >
            <div
              className={cn(
                "sb-face relative flex min-h-[260px] flex-col items-center justify-center gap-2 overflow-hidden px-6 text-center",
                verdict ? VERDICT_STYLE[verdict.status] : "text-night-500"
              )}
            >
              {verdict === null && (
                <div className="sb-scan-veil led-grid animate-sb-scan opacity-[0.04]" />
              )}
              <span className="font-display text-xs uppercase tracking-board text-night-500">Miglio</span>
              {verdict?.status === "ACTIVE" ? (
                <>
                  <p className="font-display text-5xl font-bold uppercase md:text-6xl">
                    MIGLIO RILANCIA A
                  </p>
                  {verdict.nextBid !== null && (
                    <p className="sb-jumbo text-8xl text-via-300">{verdict.nextBid}</p>
                  )}
                </>
              ) : (
                <p className="font-display text-5xl font-bold uppercase md:text-6xl">
                  {verdict ? verdictLabel(verdict) : "—"}
                </p>
              )}
            </div>
          </div>

          {!assignOpen && (
            <button type="button" onClick={openAssignPanel} className="sb-btn sb-btn--faro text-xl">
              ASSEGNA A MIGLIO
            </button>
          )}

          {assignOpen && (
            <div className="sb-bezel">
              <div className="sb-face sb-panel flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {selected.openSlots.map((slot) => (
                    <RoleChip
                      key={slot}
                      code={slot}
                      selected={assignSlot === slot}
                      onClick={() => setAssignSlot(slot)}
                    />
                  ))}
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={assignPrice}
                  onChange={(event) => setAssignPrice(event.target.value)}
                  placeholder="Prezzo finale"
                  className="sb-input sb-digit text-right text-2xl"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={assigning || assignSlot === "" || assignPrice === ""}
                    onClick={() => void handleAssign()}
                    className="sb-btn sb-btn--via"
                  >
                    CONFERMA ASSEGNAZIONE
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignOpen(false)}
                    className="sb-btn sb-btn--ghost"
                  >
                    annulla
                  </button>
                </div>
                {assignError && <p className="sb-alert">{assignError}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

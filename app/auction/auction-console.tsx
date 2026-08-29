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
  miglioCallName: string | null;
}

interface Verdict {
  status: BidStatus;
  nextBid: number | null;
}

const VERDICT_STYLE: Record<BidStatus, string> = {
  ACTIVE: "ds-status-success",
  OUT: "ds-status-error",
  NOT_INTERESTED: "ds-status-neutral",
  SLOT_FULL: "ds-status-neutral",
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

export default function AuctionConsole({ autocompleteIndex, openSlots, miglioCallName }: AuctionConsoleProps) {
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
  const [miglioCallVisible, setMiglioCallVisible] = useState(false);

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
    <div className="ds-auction-console">
      <section className="ds-call-strip">
        <div>
          <p className="ds-caption uppercase">Prossima chiamata</p>
          <p className="ds-call-name">{miglioCallVisible ? miglioCallName ?? "NESSUN NOME" : "Pronto"}</p>
        </div>
        <button type="button" onClick={() => setMiglioCallVisible(true)} className="ds-button-primary">
          Miglio chiama
        </button>
      </section>

      {!selected && (
        <section className="ds-card-dark ds-card-pad ds-auction-search">
          <div className="flex flex-col gap-2">
            <h1 className="ds-display">Asta live</h1>
            <p className="ds-muted">Cerca il giocatore, inserisci il prezzo corrente, segui solo il verdetto.</p>
          </div>
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
              className="ds-input w-full text-[30px] font-medium leading-none"
            />
            {matches.length > 0 && (
              <ul className="ds-card-dark absolute z-10 mt-2 w-full overflow-hidden">
                {matches.map((entry, index) => (
                  <li
                    key={entry.playerName}
                    onClick={() => selectEntry(entry)}
                    className={`cursor-pointer px-4 py-3 ${
                      index === highlightIndex ? "bg-[var(--color-primary)] text-[var(--color-text)]" : ""
                    }`}
                  >
                    <span className="font-semibold">{entry.playerName}</span>{" "}
                    <span className={index === highlightIndex ? "text-[var(--color-text)]" : "ds-muted"}>
                      · {entry.roleGroups.join("/")} · slot: {entry.openSlots.join(", ") || "nessuno aperto"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {selected && (
        <section className="ds-cockpit-panel">
          <div className="ds-card-dark ds-card-pad ds-cockpit-main">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="ds-caption uppercase">Giocatore in corso</p>
                <h1 className="ds-display mt-2 uppercase">{selected.playerName}</h1>
                <p className="ds-muted mt-2">
                  {selected.roleGroups.join("/")} · slot aperti: {selected.openSlots.join(", ") || "nessuno"}
                </p>
              </div>
              <button type="button" onClick={resetToSearch} className="ds-button-tertiary">
                cambia
              </button>
            </div>

            {selected.openSlots.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {selected.openSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPinnedSlot(pinnedSlot === slot ? null : slot)}
                    className={`min-h-11 rounded-[var(--radius-sm)] px-4 py-2 text-[14px] ${
                      pinnedSlot === slot
                        ? "bg-[var(--color-primary)] text-[var(--color-text)] shadow-[var(--shadow-lg)]"
                        : "bg-[var(--color-text)] text-[var(--color-neutral-900)] shadow-[var(--shadow-sm)]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}

            <div className="ds-bid-row">
              <input
                ref={bidInputRef}
                type="number"
                inputMode="numeric"
                value={bidValue}
                onChange={(event) => setBidValue(event.target.value)}
                onKeyDown={handleBidKeyDown}
                placeholder="0"
                className="ds-input ds-bid-input"
              />
              <button
                type="button"
                disabled={checking || bidValue === ""}
                onClick={() => void handleCheck()}
                className="ds-button-primary ds-check-button disabled:opacity-40"
              >
                {checking ? "CONTROLLO..." : "CONTROLLA"}
              </button>
            </div>

            <div className={`ds-verdict ${verdict ? VERDICT_STYLE[verdict.status] : "ds-card-dark"}`}>
              {verdict ? verdictLabel(verdict) : "—"}
            </div>
          </div>

          <aside className="ds-stack">
            {!assignOpen && (
              <button type="button" onClick={openAssignPanel} className="ds-button-primary w-fit">
                ASSEGNA A MIGLIO
              </button>
            )}

            {assignOpen && (
              <div className="ds-card-dark ds-card-pad flex flex-col gap-4">
                <p className="text-[20px] font-semibold leading-[1.5]">Assegna acquisto</p>
                <div className="flex flex-wrap gap-2">
                  {selected.openSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setAssignSlot(slot)}
                      className={`min-h-11 rounded-[var(--radius-sm)] px-4 py-2 text-[14px] ${
                        assignSlot === slot
                          ? "bg-[var(--color-primary)] text-[var(--color-text)] shadow-[var(--shadow-lg)]"
                          : "bg-[var(--color-text)] text-[var(--color-neutral-900)] shadow-[var(--shadow-sm)]"
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
                  className="ds-input text-[24px] font-bold leading-none"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={assigning || assignSlot === "" || assignPrice === ""}
                    onClick={() => void handleAssign()}
                    className="ds-button-primary disabled:opacity-40"
                  >
                    CONFERMA
                  </button>
                  <button type="button" onClick={() => setAssignOpen(false)} className="ds-button-tertiary">
                    annulla
                  </button>
                </div>
                {assignError && <p className="text-[14px] font-bold text-[var(--color-warning)]">{assignError}</p>}
              </div>
            )}
          </aside>
        </section>
      )}

      <details
        open={manualOpen}
        onToggle={(event) => setManualOpen(event.currentTarget.open)}
        className="ds-card-dark ds-card-pad"
      >
        <summary className="cursor-pointer list-none">
          <span className="ds-button-tertiary">
            {manualOpen ? "chiudi assegnazione manuale" : "Assegnazione manuale"}
          </span>
        </summary>
        <div className="mt-4 flex flex-col gap-2">
          <input
            value={manualName}
            onChange={(event) => setManualName(event.target.value)}
            onFocus={() => setManualOpen(true)}
            placeholder="Nome giocatore"
            className="ds-input"
          />
          <select
            value={manualSlot}
            onChange={(event) => setManualSlot(event.target.value as SlotCode | "")}
            className="ds-input"
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
            className="ds-input"
          />
          <button
            type="button"
            disabled={manualSubmitting || manualName.trim() === "" || manualSlot === "" || manualPrice === ""}
            onClick={() => void handleManualAssign()}
            className="ds-button-primary w-fit disabled:opacity-40"
          >
            ASSEGNA MANUALMENTE
          </button>
          {manualError && <p className="text-[14px] font-bold text-[var(--color-warning)]">{manualError}</p>}
        </div>
      </details>
    </div>
  );
}

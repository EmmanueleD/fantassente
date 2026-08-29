"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface SetupTabsProps {
  strategyContent: ReactNode;
  teamContent: ReactNode;
}

export default function SetupTabs({ strategyContent, teamContent }: SetupTabsProps) {
  const [tab, setTab] = useState<"strategia" | "squadra">("strategia");
  const [isPending, startTransition] = useTransition();
  const [justRefreshed, setJustRefreshed] = useState(false);
  const hasPendingRefreshRef = useRef(false);
  const router = useRouter();

  function handleRefresh() {
    hasPendingRefreshRef.current = true;
    startTransition(() => {
      router.refresh();
    });
  }

  useEffect(() => {
    if (!isPending && hasPendingRefreshRef.current) {
      hasPendingRefreshRef.current = false;
      setJustRefreshed(true);
      const timeout = setTimeout(() => setJustRefreshed(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isPending]);

  return (
    <div className="ds-stack">
      <div className="ds-card-dark ds-card-pad flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setTab("strategia")}
          className={tab === "strategia" ? "ds-button-primary" : "ds-button-tertiary"}
        >
          Strategia
        </button>
        <button
          type="button"
          onClick={() => setTab("squadra")}
          className={tab === "squadra" ? "ds-button-primary" : "ds-button-tertiary"}
        >
          La mia squadra
        </button>
        {tab === "squadra" && (
          <div className="ml-auto flex items-center gap-2">
            {justRefreshed && <span className="font-semibold text-[var(--color-success)]">Aggiornato ✓</span>}
            <button type="button" onClick={handleRefresh} disabled={isPending} className="ds-button-secondary">
              {isPending ? "Aggiornamento..." : "Aggiorna"}
            </button>
          </div>
        )}
      </div>
      {tab === "strategia" ? strategyContent : teamContent}
    </div>
  );
}

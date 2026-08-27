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

  // Fires once the refreshed RSC payload from router.refresh() has actually
  // been applied (isPending flips true -> false), not on initial mount.
  useEffect(() => {
    if (!isPending && hasPendingRefreshRef.current) {
      hasPendingRefreshRef.current = false;
      setJustRefreshed(true);
      const timeout = setTimeout(() => setJustRefreshed(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isPending]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 border-b border-night-700 pb-0">
        <button
          type="button"
          onClick={() => setTab("strategia")}
          data-active={tab === "strategia" ? "true" : undefined}
          className="sb-tab"
        >
          Strategia
        </button>
        <button
          type="button"
          onClick={() => setTab("squadra")}
          data-active={tab === "squadra" ? "true" : undefined}
          className="sb-tab"
        >
          La mia squadra
        </button>
        {tab === "squadra" && (
          <div className="ml-auto flex items-center gap-2">
            {justRefreshed && <span className="sb-badge--via animate-sb-ack">Aggiornato ✓</span>}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isPending}
              className="sb-btn sb-btn--ghost"
            >
              <span className="animate-sb-settle" key={isPending ? "pending" : "idle"}>
                {isPending ? "Aggiornamento..." : "Aggiorna"}
              </span>
            </button>
          </div>
        )}
      </div>
      <div key={tab} className="animate-sb-settle">
        {tab === "strategia" ? strategyContent : teamContent}
      </div>
    </div>
  );
}

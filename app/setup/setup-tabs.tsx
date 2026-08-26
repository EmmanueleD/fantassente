"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useWebHaptics } from "web-haptics/react";

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
  const { trigger } = useWebHaptics();

  function handleRefresh() {
    // Immediate tap feedback on supported mobile browsers — no-ops silently
    // where the Vibration API isn't available (desktop, iOS Safari).
    void trigger("nudge");
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
      void trigger("success");
      setJustRefreshed(true);
      const timeout = setTimeout(() => setJustRefreshed(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isPending, trigger]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4 border-b border-slate-700 pb-2">
        <button
          type="button"
          onClick={() => setTab("strategia")}
          className={`text-lg font-semibold ${tab === "strategia" ? "text-white" : "text-slate-500"}`}
        >
          Strategia
        </button>
        <button
          type="button"
          onClick={() => setTab("squadra")}
          className={`text-lg font-semibold ${tab === "squadra" ? "text-white" : "text-slate-500"}`}
        >
          La mia squadra
        </button>
        {tab === "squadra" && (
          <div className="ml-auto flex items-center gap-2">
            {justRefreshed && (
              <span className="text-sm font-semibold text-green-400">Aggiornato ✓</span>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isPending}
              className="rounded bg-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50"
            >
              {isPending ? "Aggiornamento..." : "Aggiorna"}
            </button>
          </div>
        )}
      </div>
      {tab === "strategia" ? strategyContent : teamContent}
    </div>
  );
}

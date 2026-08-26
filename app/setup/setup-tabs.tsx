"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface SetupTabsProps {
  strategyContent: ReactNode;
  teamContent: ReactNode;
}

export default function SetupTabs({ strategyContent, teamContent }: SetupTabsProps) {
  const [tab, setTab] = useState<"strategia" | "squadra">("strategia");
  const router = useRouter();

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
          <button
            type="button"
            onClick={() => router.refresh()}
            className="ml-auto rounded bg-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-600"
          >
            Aggiorna
          </button>
        )}
      </div>
      {tab === "strategia" ? strategyContent : teamContent}
    </div>
  );
}

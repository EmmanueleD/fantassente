"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="rounded bg-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-600"
    >
      Esci
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ROLE, type Role } from "@/lib/types";

export default function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(ROLE.MIGLIO);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });
      if (!res.ok) {
        setError("Credenziali non valide");
        return;
      }
      const data = (await res.json()) as { redirectTo: string };
      router.push(data.redirectTo);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-slate-800 p-8"
    >
      <h1 className="text-2xl font-bold">Accedi</h1>
      <fieldset className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="role"
            value={ROLE.MIGLIO}
            checked={role === ROLE.MIGLIO}
            onChange={() => setRole(ROLE.MIGLIO)}
          />
          Miglio
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="role"
            value={ROLE.JABU}
            checked={role === ROLE.JABU}
            onChange={() => setRole(ROLE.JABU)}
          />
          Jabu
        </label>
      </fieldset>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        autoFocus
        className="rounded-lg bg-slate-700 px-4 py-2 text-white"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-green-600 px-4 py-2 font-bold text-white disabled:opacity-50"
      >
        Entra
      </button>
    </form>
  );
}

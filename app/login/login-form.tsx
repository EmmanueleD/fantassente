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
      className="sb-bezel flex w-full max-w-sm flex-col"
    >
      <div className="sb-face sb-panel flex flex-col gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-board text-chalk-050">
            Accedi
          </h1>
          <div className="sb-rail" aria-hidden="true" />
        </div>
        <fieldset className="flex gap-3">
          <label className="sb-chip flex-1 cursor-pointer justify-start gap-2 py-3 [min-height:48px] has-[:checked]:border-faro-500 has-[:checked]:drop-shadow-flood">
            <input
              type="radio"
              name="role"
              value={ROLE.MIGLIO}
              checked={role === ROLE.MIGLIO}
              onChange={() => setRole(ROLE.MIGLIO)}
              className="sr-only"
            />
            <span className="sb-digit text-faro-300">M</span>
            <span className="font-display text-sm uppercase tracking-board">
              Miglio
            </span>
          </label>
          <label className="sb-chip flex-1 cursor-pointer justify-start gap-2 py-3 [min-height:48px] has-[:checked]:border-faro-500 has-[:checked]:drop-shadow-flood">
            <input
              type="radio"
              name="role"
              value={ROLE.JABU}
              checked={role === ROLE.JABU}
              onChange={() => setRole(ROLE.JABU)}
              className="sr-only"
            />
            <span className="sb-digit text-faro-300">J</span>
            <span className="font-display text-sm uppercase tracking-board">
              Jabu
            </span>
          </label>
        </fieldset>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoFocus
          className="sb-input"
        />
        {error && (
          <p className="sb-alert animate-sb-settle text-sm">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="sb-btn sb-btn--faro w-full uppercase"
        >
          Entra
        </button>
      </div>
    </form>
  );
}

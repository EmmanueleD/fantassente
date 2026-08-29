"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Role } from "@/lib/types";

interface LoginFormProps {
  role: Role;
  title?: string;
  submitLabel?: string;
}

export default function LoginForm({ role, title = "Accedi", submitLabel = "Entra" }: LoginFormProps) {
  const router = useRouter();
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
    <form onSubmit={handleSubmit} className="ds-card-dark ds-card-pad flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="ds-display">{title}</h1>
        <p className="ds-muted">Accesso privato asta Fantacalcio</p>
      </div>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        autoFocus
        className="ds-input w-full"
      />
      {error && <p className="text-[14px] font-semibold text-[var(--color-warning)]">{error}</p>}
      <button type="submit" disabled={submitting} className="ds-button-primary w-fit">
        {submitting ? "Attendere..." : submitLabel}
      </button>
    </form>
  );
}

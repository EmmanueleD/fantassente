/** Case-insensitive, whitespace-trimmed name normalization (spec §3.1, §7). */
export function normalizeName(s: string): string {
  return s.trim().toLowerCase();
}

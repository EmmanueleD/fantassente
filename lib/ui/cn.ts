/**
 * Dependency-free class joiner. `clsx`/`tailwind-merge` are not installed
 * and must not be added — variants are distinct `.sb-btn--*` classes rather
 * than conflicting Tailwind utilities, so a merge-aware `cn` is unnecessary.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

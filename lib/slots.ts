/**
 * Fixed set of 25 slot codes (spec §1.1) — immutable, not user-configurable.
 */

export const SLOT_CODES = [
  "P1", "P2", "P3",
  "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8",
  "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8",
  "A1", "A2", "A3", "A4", "A5", "A6",
] as const;

export type SlotCode = (typeof SLOT_CODES)[number];

export const TOTAL_SLOTS = SLOT_CODES.length;

export const ROLE_GROUP = {
  P: "P",
  D: "D",
  C: "C",
  A: "A",
} as const;

export type RoleGroup = (typeof ROLE_GROUP)[keyof typeof ROLE_GROUP];

/** Derives the role group (P/D/C/A) from a slot code's prefix letter. */
export function roleGroupOf(slot: SlotCode): RoleGroup {
  const prefix = slot.charAt(0);
  if (prefix === "P" || prefix === "D" || prefix === "C" || prefix === "A") {
    return prefix;
  }
  throw new Error(`Invalid slot code: ${slot}`);
}

/** Runtime type guard: is the given string one of the 25 fixed slot codes? */
export function isSlotCode(value: string): value is SlotCode {
  return (SLOT_CODES as readonly string[]).includes(value);
}

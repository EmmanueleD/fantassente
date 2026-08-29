import type { SlotCode } from "@/lib/slots";

export interface MiglioCallCandidate {
  slot: SlotCode;
  playerName: string;
  priority: number;
}

export function recommendMiglioCallName(
  openSlots: readonly SlotCode[],
  candidates: readonly MiglioCallCandidate[]
): string | null {
  const firstOpenSlot = openSlots[0];
  if (!firstOpenSlot) {
    return null;
  }

  const preferredCandidate = candidates
    .filter((candidate) => candidate.slot === firstOpenSlot)
    .toSorted((a, b) => a.priority - b.priority || a.playerName.localeCompare(b.playerName))[0];

  return preferredCandidate?.playerName ?? null;
}

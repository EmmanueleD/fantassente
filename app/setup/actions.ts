"use server";

import { revalidatePath } from "next/cache";
import { ROLE } from "@/lib/types";
import { requireRole } from "@/lib/auth/guard";
import { isSlotCode } from "@/lib/slots";
import * as setupService from "@/lib/setup/setup-service";
import type { WriteResult } from "@/lib/setup/setup-service";

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export async function addCandidateAction(
  slot: string,
  playerName: string,
  maxPrice: number,
  priority: number
): Promise<WriteResult> {
  await requireRole(ROLE.MIGLIO);
  const trimmedName = playerName.trim();
  if (!isSlotCode(slot) || trimmedName === "" || !isPositiveInteger(maxPrice) || !isPositiveInteger(priority)) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const result = await setupService.addCandidate(slot, trimmedName, maxPrice, priority);
  if (result.ok) {
    revalidatePath("/setup");
  }
  return result;
}

export async function updateCandidatePriceAction(id: number, maxPrice: number): Promise<WriteResult> {
  await requireRole(ROLE.MIGLIO);
  if (!Number.isInteger(id) || !isPositiveInteger(maxPrice)) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const result = await setupService.updateCandidatePrice(id, maxPrice);
  if (result.ok) {
    revalidatePath("/setup");
  }
  return result;
}

export async function deleteCandidateAction(id: number): Promise<WriteResult> {
  await requireRole(ROLE.MIGLIO);
  if (!Number.isInteger(id)) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const result = await setupService.deleteCandidate(id);
  if (result.ok) {
    revalidatePath("/setup");
  }
  return result;
}

export async function reorderCandidatesAction(slot: string, orderedIds: number[]): Promise<WriteResult> {
  await requireRole(ROLE.MIGLIO);
  if (!isSlotCode(slot) || orderedIds.length === 0 || orderedIds.some((id) => !Number.isInteger(id))) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const result = await setupService.reorderCandidates(slot, orderedIds);
  if (result.ok) {
    revalidatePath("/setup");
  }
  return result;
}

export async function setInitialBudgetAction(initialBudget: number): Promise<WriteResult> {
  await requireRole(ROLE.MIGLIO);
  if (!isPositiveInteger(initialBudget)) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const result = await setupService.setInitialBudget(initialBudget);
  if (result.ok) {
    revalidatePath("/setup");
  }
  return result;
}

export async function lockStrategyAction(): Promise<WriteResult> {
  await requireRole(ROLE.MIGLIO);
  const result = await setupService.lockStrategy();
  if (result.ok) {
    revalidatePath("/setup");
  }
  return result;
}

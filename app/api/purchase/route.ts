import { NextResponse } from "next/server";
import { ROLE } from "@/lib/types";
import { isSlotCode } from "@/lib/slots";
import { requireRole } from "@/lib/auth/guard";
import {
  assignPurchase,
  updatePurchase,
  deletePurchase,
} from "@/lib/purchases/purchase-service";

interface PurchaseBody {
  slot?: unknown;
  playerName?: unknown;
  finalPrice?: unknown;
}

interface DeleteBody {
  slot?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireRole(ROLE.JABU);
  } catch {
    return new NextResponse(null, { status: 401 });
  }

  let body: PurchaseBody;
  try {
    body = (await request.json()) as PurchaseBody;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const { slot, playerName, finalPrice } = body;

  if (typeof slot !== "string" || !isSlotCode(slot)) {
    return new NextResponse(null, { status: 400 });
  }
  const trimmedName = typeof playerName === "string" ? playerName.trim() : "";
  if (trimmedName === "") {
    return new NextResponse(null, { status: 400 });
  }
  if (
    typeof finalPrice !== "number" ||
    !Number.isInteger(finalPrice) ||
    finalPrice <= 0
  ) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const result = await assignPurchase(slot, trimmedName, finalPrice);

    if (!result.ok) {
      if (result.error === "SLOT_FILLED") {
        return NextResponse.json({ error: "SLOT_FILLED" }, { status: 409 });
      }
      if (result.error === "PRICE_EXCEEDS_BUDGET") {
        return NextResponse.json(
          { error: "PRICE_EXCEEDS_BUDGET", maxAffordable: result.maxAffordable },
          { status: 422 }
        );
      }
      return new NextResponse(null, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      slot,
      playerName: trimmedName,
      finalPrice,
      remainingBudget: result.remainingBudget,
    });
  } catch (error) {
    console.error("purchase assignment failed", error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    await requireRole(ROLE.JABU);
  } catch {
    return new NextResponse(null, { status: 401 });
  }

  let body: PurchaseBody;
  try {
    body = (await request.json()) as PurchaseBody;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const { slot, playerName, finalPrice } = body;

  if (typeof slot !== "string" || !isSlotCode(slot)) {
    return new NextResponse(null, { status: 400 });
  }
  const trimmedName = typeof playerName === "string" ? playerName.trim() : "";
  if (trimmedName === "") {
    return new NextResponse(null, { status: 400 });
  }
  if (
    typeof finalPrice !== "number" ||
    !Number.isInteger(finalPrice) ||
    finalPrice <= 0
  ) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const result = await updatePurchase(slot, trimmedName, finalPrice);

    if (!result.ok) {
      if (result.error === "PURCHASE_NOT_FOUND") {
        return NextResponse.json({ error: "PURCHASE_NOT_FOUND" }, { status: 404 });
      }
      if (result.error === "PRICE_EXCEEDS_BUDGET") {
        return NextResponse.json(
          { error: "PRICE_EXCEEDS_BUDGET", maxAffordable: result.maxAffordable },
          { status: 422 }
        );
      }
      return new NextResponse(null, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      slot,
      playerName: trimmedName,
      finalPrice,
      remainingBudget: result.remainingBudget,
    });
  } catch (error) {
    console.error("purchase update failed", error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    await requireRole(ROLE.JABU);
  } catch {
    return new NextResponse(null, { status: 401 });
  }

  let body: DeleteBody;
  try {
    body = (await request.json()) as DeleteBody;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const { slot } = body;

  if (typeof slot !== "string" || !isSlotCode(slot)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const result = await deletePurchase(slot);

    if (!result.ok) {
      return NextResponse.json({ error: "PURCHASE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, slot });
  } catch (error) {
    console.error("purchase delete failed", error);
    return new NextResponse(null, { status: 500 });
  }
}

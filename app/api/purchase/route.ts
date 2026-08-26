import { NextResponse } from "next/server";
import { ROLE } from "@/lib/types";
import { isSlotCode } from "@/lib/slots";
import { requireRole } from "@/lib/auth/guard";
import { assignPurchase } from "@/lib/purchases/purchase-service";

interface PurchaseBody {
  slot?: unknown;
  playerName?: unknown;
  finalPrice?: unknown;
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
      return NextResponse.json(
        { error: "PRICE_EXCEEDS_BUDGET", maxAffordable: result.maxAffordable },
        { status: 422 }
      );
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

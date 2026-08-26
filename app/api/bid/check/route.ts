import { NextResponse } from "next/server";
import { ROLE } from "@/lib/types";
import { isSlotCode, type SlotCode } from "@/lib/slots";
import { requireRole } from "@/lib/auth/guard";
import { runBidCheck } from "@/lib/bidding/bid-service";

interface CheckBody {
  playerName?: unknown;
  proposedBid?: unknown;
  slot?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireRole(ROLE.JABU);
  } catch {
    return new NextResponse(null, { status: 401 });
  }

  let body: CheckBody;
  try {
    body = (await request.json()) as CheckBody;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const { playerName, proposedBid, slot } = body;

  if (typeof playerName !== "string" || playerName.trim() === "") {
    return new NextResponse(null, { status: 400 });
  }

  if (
    typeof proposedBid !== "number" ||
    !Number.isInteger(proposedBid) ||
    proposedBid <= 0
  ) {
    return new NextResponse(null, { status: 400 });
  }

  let resolvedSlot: SlotCode | null = null;
  if (slot !== undefined && slot !== null) {
    if (typeof slot !== "string" || !isSlotCode(slot)) {
      return new NextResponse(null, { status: 400 });
    }
    resolvedSlot = slot;
  }

  try {
    const result = await runBidCheck(playerName, proposedBid, resolvedSlot);
    // Never spread `result` — construct the response field-by-field so a
    // polluted/leaked upstream object can never widen the response shape.
    return NextResponse.json({ status: result.status, nextBid: result.nextBid });
  } catch (error) {
    console.error("bid-check failed", error);
    return new NextResponse(null, { status: 500 });
  }
}

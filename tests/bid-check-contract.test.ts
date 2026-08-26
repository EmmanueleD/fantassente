import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const runBidCheckMock = vi.fn();
vi.mock("@/lib/bidding/bid-service", () => ({
  runBidCheck: (...args: unknown[]) => runBidCheckMock(...args),
}));

const requireRoleMock = vi.fn();
vi.mock("@/lib/auth/guard", () => ({
  requireRole: (...args: unknown[]) => requireRoleMock(...args),
}));

import { POST } from "@/app/api/bid/check/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/bid/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/bid/check contract", () => {
  beforeEach(() => {
    runBidCheckMock.mockReset();
    requireRoleMock.mockReset();
    requireRoleMock.mockResolvedValue("jabu");
  });

  const statuses: Array<{ status: string; nextBid: number | null }> = [
    { status: "ACTIVE", nextBid: 81 },
    { status: "OUT", nextBid: null },
    { status: "NOT_INTERESTED", nextBid: null },
    { status: "SLOT_FULL", nextBid: null },
  ];

  for (const canned of statuses) {
    it(`returns exactly {status, nextBid} for ${canned.status}`, async () => {
      runBidCheckMock.mockResolvedValue(canned);
      const res = await POST(makeRequest({ playerName: "Lautaro", proposedBid: 80 }));
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(Object.keys(body).sort()).toEqual(["nextBid", "status"]);
      expect(body.status).toBe(canned.status);
      expect(body.nextBid).toBe(canned.nextBid);
    });
  }

  it("returns 401 with no body when unauthorized", async () => {
    requireRoleMock.mockRejectedValue(new Error("UNAUTHORIZED"));
    const res = await POST(makeRequest({ playerName: "Lautaro", proposedBid: 80 }));
    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe("");
  });

  it("returns 400 with no body on malformed JSON", async () => {
    const req = new Request("http://localhost/api/bid/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe("");
  });

  const invalidBids: unknown[] = [0, -1, "80", 1.5, undefined];
  for (const proposedBid of invalidBids) {
    it(`returns 400 with no body for invalid proposedBid=${JSON.stringify(proposedBid)}`, async () => {
      const payload: Record<string, unknown> = { playerName: "Lautaro" };
      if (proposedBid !== undefined) {
        payload.proposedBid = proposedBid;
      }
      const res = await POST(makeRequest(payload));
      expect(res.status).toBe(400);
      const text = await res.text();
      expect(text).toBe("");
    });
  }

  it("adversarial: strips extra fields even when bid-service returns a polluted object", async () => {
    runBidCheckMock.mockResolvedValue({
      status: "ACTIVE",
      nextBid: 81,
      maxPrice: 999,
      secret: "leak",
    } as unknown);

    const res = await POST(makeRequest({ playerName: "Lautaro", proposedBid: 80 }));
    expect(res.status).toBe(200);
    const raw = await res.text();
    const body = JSON.parse(raw) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["nextBid", "status"]);
    expect(raw).not.toContain("999");
    expect(raw).not.toContain("leak");
  });

  it("returns 500 with no body on unexpected exception", async () => {
    runBidCheckMock.mockRejectedValue(new Error("db down"));
    const res = await POST(makeRequest({ playerName: "Lautaro", proposedBid: 80 }));
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe("");
  });
});

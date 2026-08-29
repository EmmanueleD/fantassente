import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/login/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/login", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JABU_PASSWORD: "jabu-secret",
      SESSION_SECRET: "test-session-secret-with-enough-length",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("accepts the hardcoded Miglio password and redirects to setup", async () => {
    const res = await POST(makeRequest({ role: "miglio", password: "m" }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ redirectTo: "/setup" });
    expect(res.headers.get("set-cookie")).toContain("fa_session=");
  });

  it("rejects an incorrect Miglio password", async () => {
    const res = await POST(makeRequest({ role: "miglio", password: "wrong" }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "invalid" });
  });

  it("keeps Jabu login env-password based", async () => {
    const res = await POST(makeRequest({ role: "jabu", password: "jabu-secret" }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ redirectTo: "/auction" });
  });
});

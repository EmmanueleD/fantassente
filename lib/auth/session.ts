/**
 * Session/token primitives (design §3.1).
 *
 * Deliberately NO "server-only" import: this module is imported by
 * middleware.ts, which runs in the Node.js middleware runtime but is not a
 * Route Handler / Server Component, so the `server-only` package's guard
 * would be inapplicable there. Its `node:crypto` import is itself an
 * effective client-bundle guard (bundling this into a Client Component would
 * fail to resolve `node:crypto` in the browser runtime).
 */
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { ROLE, type Role } from "../types";

export const COOKIE_NAME = "fa_session";
export const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function isRole(value: string): value is Role {
  return value === ROLE.MIGLIO || value === ROLE.JABU;
}

/**
 * Constant-time, length-safe password comparison. Hashing both sides first
 * makes the buffers fixed-length (32 bytes), so `timingSafeEqual` never
 * throws on length mismatch and length itself is not leaked.
 */
export function verifyPassword(input: string, expected: string | undefined): boolean {
  if (!expected) {
    return false;
  }
  const inputHash = createHash("sha256").update(input).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(inputHash, expectedHash);
}

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET ?? "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Produces a `<role>.<expEpochSeconds>.<sig>` HMAC-signed token. */
export function signSession(role: Role): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${role}.${exp}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

/** Verifies a token; returns the Role on success, null on any failure. Never throws. */
export function verifySession(token: string | undefined): Role | null {
  if (!token) {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [role, expStr, sig] = parts;
  if (!role || !expStr || !sig || !isRole(role)) {
    return null;
  }
  const exp = Number(expStr);
  if (!Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const expectedSig = sign(`${role}.${expStr}`);
  const expectedBuf = Buffer.from(expectedSig);
  const actualBuf = Buffer.from(sig);
  if (expectedBuf.length !== actualBuf.length) {
    return null;
  }
  if (!timingSafeEqual(expectedBuf, actualBuf)) {
    return null;
  }

  return role;
}

/** Cookie attributes shared by set (login) and clear (logout). */
export function sessionCookieAttrs() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TTL_SECONDS,
  };
}

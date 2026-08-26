import "server-only";
import { cookies } from "next/headers";
import type { Role } from "../types";
import { COOKIE_NAME, verifySession } from "./session";

/**
 * Defense-in-depth role check for Route Handlers / Server Actions
 * (design §3.3). Middleware is the primary gate; this ensures no handler
 * silently trusts an unverified request even if middleware config drifts.
 */
export async function requireRole(role: Role): Promise<Role> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const actual = verifySession(token);
  if (actual !== role) {
    throw new Error("UNAUTHORIZED");
  }
  return actual;
}

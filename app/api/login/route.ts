import { NextResponse } from "next/server";
import { ROLE, type Role } from "@/lib/types";
import { COOKIE_NAME, sessionCookieAttrs, signSession, verifyPassword } from "@/lib/auth/session";

function isRole(value: unknown): value is Role {
  return value === ROLE.MIGLIO || value === ROLE.JABU;
}

const REDIRECT_TO: Record<Role, string> = {
  [ROLE.MIGLIO]: "/setup",
  [ROLE.JABU]: "/auction",
};

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const { role, password } = body as { role?: unknown; password?: unknown };

  if (!isRole(role) || typeof password !== "string") {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const expected =
    role === ROLE.MIGLIO ? process.env.MIGLIO_PASSWORD : process.env.JABU_PASSWORD;

  if (!verifyPassword(password, expected)) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const redirectTo = REDIRECT_TO[role];
  const response = NextResponse.json({ redirectTo });
  response.cookies.set(COOKIE_NAME, signSession(role), sessionCookieAttrs());
  return response;
}

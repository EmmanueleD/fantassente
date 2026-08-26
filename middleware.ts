import { NextResponse, type NextRequest } from "next/server";
import { ROLE, type Role } from "@/lib/types";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";

export const runtime = "nodejs";

export const config = {
  matcher: ["/", "/setup/:path*", "/auction/:path*", "/api/bid/:path*", "/api/purchase"],
};

const HOME_ROUTE: Record<Role, string> = {
  [ROLE.MIGLIO]: "/setup",
  [ROLE.JABU]: "/auction",
};

function requiredRoleFor(pathname: string): Role | null {
  if (pathname.startsWith("/setup") || pathname.startsWith("/api/setup")) {
    return ROLE.MIGLIO;
  }
  if (
    pathname.startsWith("/auction") ||
    pathname.startsWith("/api/bid/") ||
    pathname === "/api/purchase"
  ) {
    return ROLE.JABU;
  }
  return null;
}

export function middleware(request: NextRequest): Response {
  const { pathname } = request.nextUrl;
  const role = verifySession(request.cookies.get(COOKIE_NAME)?.value);
  const isApiPath = pathname.startsWith("/api/");

  if (pathname === "/") {
    if (role) {
      return NextResponse.redirect(new URL(HOME_ROUTE[role], request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const required = requiredRoleFor(pathname);
  if (required === null || role === required) {
    return NextResponse.next();
  }

  if (isApiPath) {
    return new NextResponse(null, { status: 401 });
  }

  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.redirect(new URL(HOME_ROUTE[role], request.url));
}

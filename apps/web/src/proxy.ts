import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Once setup is complete (admin exists), it can never become incomplete again.
 * Cache indefinitely after the first `true` result.
 * While still `false`, re-check every 10 seconds (not on every request).
 */
let setupDone = false;
let lastChecked: boolean | null = null;
let lastCheckMs = 0;

async function isSetupComplete(origin: string): Promise<boolean> {
  if (setupDone) return true;

  const now = Date.now();
  // Throttle rechecks — use cached result if recent
  if (lastChecked !== null && now - lastCheckMs < 10_000) {
    return lastChecked;
  }

  lastCheckMs = now;

  try {
    const res = await fetch(new URL("/api/setup", origin));
    const { setupComplete } = await res.json();
    lastChecked = !!setupComplete;
    if (setupComplete) setupDone = true;
    return lastChecked;
  } catch {
    // On first check failure, assume incomplete; on subsequent, use last result
    return lastChecked ?? false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets / API auth — always allow
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Setup API — always allow (it self-guards)
  if (pathname.startsWith("/api/setup")) {
    return NextResponse.next();
  }

  const isSetupPage = pathname === "/setup";
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // For non-API routes, check setup status (cached)
  if (!pathname.startsWith("/api")) {
    const setupComplete = await isSetupComplete(request.nextUrl.origin);

    // No admin exists → force to /setup
    if (!setupComplete && !isSetupPage) {
      return NextResponse.redirect(new URL("/setup", request.nextUrl));
    }

    // Setup done → block /setup page
    if (setupComplete && isSetupPage) {
      return NextResponse.redirect(new URL("/login", request.nextUrl));
    }

    // Setup page doesn't need auth
    if (isSetupPage) {
      return NextResponse.next();
    }
  }

  // Auth check
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = !!token;

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL("/servers", request.nextUrl));
  }

  // Redirect unauthenticated users to login (except API routes)
  if (!isAuthPage && !isAuth && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (token?.role !== "ADMIN") {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/servers", request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

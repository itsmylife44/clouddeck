import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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

  // Check if setup is needed (lightweight: calls our own API)
  const isSetupPage = pathname === "/setup";
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // For non-API routes, check setup status via internal fetch
  if (!pathname.startsWith("/api")) {
    try {
      const setupRes = await fetch(new URL("/api/setup", request.nextUrl.origin));
      const { setupComplete } = await setupRes.json();

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
    } catch {
      // If setup check fails, allow through (server will handle)
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

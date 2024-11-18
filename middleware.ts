import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    const { pathname } = req.nextUrl;

    // Skip middleware for static files and api routes
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/static") ||
      pathname.includes(".")
    ) {
      return res;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Auth routes handling (login, register, etc.)
    if (pathname.startsWith("/auth")) {
      if (session) {
        // If user is logged in, redirect away from auth pages
        const redirectUrl = new URL("/dashboard", req.url);
        return NextResponse.redirect(redirectUrl);
      }
      // Allow access to auth pages if not logged in
      return res;
    }

    // Protected routes handling
    const protectedPaths = ["/dashboard", "/settings", "/leagues", "/teams"];
    if (protectedPaths.some((path) => pathname.startsWith(path))) {
      if (!session) {
        // Add a query parameter to indicate authentication is required
        const redirectUrl = new URL("/auth/login", req.url);
        redirectUrl.searchParams.set("from", pathname);
        redirectUrl.searchParams.set("message", "authentication_required");
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Update the response with the refreshed session
    return res;
  } catch (e) {
    // Return the original response if there's an error
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

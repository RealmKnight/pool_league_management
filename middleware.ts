import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    // Create a response to modify
    const res = NextResponse.next();

    // Create the Supabase client
    const supabase = createMiddlewareClient({ req, res });
    const { pathname } = req.nextUrl;

    console.log("Middleware executing for path:", pathname);

    // Skip middleware for static files and api routes
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/static") ||
      pathname.includes(".")
    ) {
      return res;
    }

    // Get the session from the client and refresh it
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Log session details for debugging
    if (session?.user) {
      console.log("Session found for user:", session.user.email);
    } else {
      console.log("No session found");
    }

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

    // Protected routes handling (dashboard, settings, etc.)
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/settings")) {
      if (!session) {
        // If no session, redirect to login
        const redirectUrl = new URL("/auth/login", req.url);
        return NextResponse.redirect(redirectUrl);
      }
      // Allow access to protected routes if logged in
      return res;
    }

    // Update the response with the refreshed session
    return res;
  } catch (e) {
    console.error("Middleware error:", e);
    // Return the original response if there's an error
    return NextResponse.next();
  }
}

// Update config to match Next.js 14 patterns
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

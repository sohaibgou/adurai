import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require an authenticated session
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/insights",
  "/creative-studio",
  "/analyze",
  "/results",
  "/admin",
];

// Auth pages — redirect authenticated users away to prevent multi-account sessions
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

  if (!isProtected && !isAuthRoute) return NextResponse.next();

  // Read the Supabase session from cookies (edge-compatible)
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Unauthenticated → protected route: redirect to login
  if (isProtected && !session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated → auth route: redirect to the app home
  // (Creative Studio). This prevents signing into a second account in a new tab.
  if (isAuthRoute && session) {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = "/creative-studio";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/insights/:path*",
    "/creative-studio/:path*",
    "/analyze/:path*",
    "/results/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};

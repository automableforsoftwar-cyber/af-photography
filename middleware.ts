import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/routing";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy alias → new dashboard tree (never to /dashboard/activate — route deleted)
  if (pathname === "/course-dashboard" || pathname.startsWith("/course-dashboard/")) {
    const url = request.nextUrl.clone();
    const panel = url.searchParams.get("panel");
    url.searchParams.delete("panel");
    if (panel === "activate" || panel === "learn" || !panel) {
      url.pathname = "/dashboard";
    } else if (panel === "community") {
      url.pathname = "/dashboard/community";
    } else {
      url.pathname = `/dashboard/${panel}`;
    }
    return NextResponse.redirect(url);
  }

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const loggedIn = request.cookies.get(SESSION_COOKIE)?.value === "1";

  // Unauthenticated → home (login CTA). Allow /dashboard itself so AuthGate can handle UX.
  if (!loggedIn && pathname !== "/dashboard" && pathname !== "/dashboard/") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "1");
    return NextResponse.redirect(url);
  }

  // No activation redirects — locked users stay on whatever /dashboard page and see VIP input in-place.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/course-dashboard", "/course-dashboard/:path*"],
};

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/routing";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy alias → dashboard tree
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

  // Public site (including `/`) — never intercept; real homepage for everyone
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const loggedIn = request.cookies.get(SESSION_COOKIE)?.value === "1";

  // Any unauthenticated dashboard visit → real homepage (login CTA), no storefront
  if (!loggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("auth", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/course-dashboard", "/course-dashboard/:path*"],
};

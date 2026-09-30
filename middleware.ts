import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/routing";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/course-dashboard" || pathname.startsWith("/course-dashboard/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // No dashboard landing portal
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Standalone /course/:id → dashboard course route
  const standalone = pathname.match(/^\/course\/([^/]+)\/?$/);
  if (standalone) {
    const url = request.nextUrl.clone();
    url.pathname = `/dashboard/courses/${standalone[1]}`;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dashboard")) {
    const loggedIn = request.cookies.get(SESSION_COOKIE)?.value === "1";
    if (!loggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      url.searchParams.set("auth", "1");
      return NextResponse.redirect(url);
    }
    // Allow dashboard sections (courses/[id], community, …) for logged-in users
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/course-dashboard",
    "/course-dashboard/:path*",
    "/course/:path*",
  ],
};

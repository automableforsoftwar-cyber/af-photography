import { NextResponse, type NextRequest } from "next/server";
import {
  ACTIVATION_COOKIE,
  DASHBOARD_PROTECTED_PREFIXES,
  SESSION_COOKIE,
} from "@/lib/routing";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy alias → new dashboard tree
  if (pathname === "/course-dashboard" || pathname.startsWith("/course-dashboard/")) {
    const url = request.nextUrl.clone();
    const panel = url.searchParams.get("panel");
    url.searchParams.delete("panel");
    if (panel === "activate") {
      url.pathname = "/dashboard/activate";
    } else if (panel === "community") {
      url.pathname = "/dashboard/community";
    } else if (panel === "learn" || !panel) {
      url.pathname = "/dashboard/courses";
    } else {
      url.pathname = `/dashboard/${panel}`;
    }
    return NextResponse.redirect(url);
  }

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const loggedIn = request.cookies.get(SESSION_COOKIE)?.value === "1";
  const activated = request.cookies.get(ACTIVATION_COOKIE)?.value === "1";

  // Unauthenticated → home (login CTA lives there)
  if (!loggedIn && pathname !== "/dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "1");
    return NextResponse.redirect(url);
  }

  // Activated users hitting /dashboard → courses
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const url = request.nextUrl.clone();
    url.pathname = activated ? "/dashboard/courses" : "/dashboard/activate";
    return NextResponse.redirect(url);
  }

  // Strict lock: unactivated users cannot open protected dashboard sections
  const isProtected = DASHBOARD_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !activated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/activate";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/course-dashboard", "/course-dashboard/:path*"],
};

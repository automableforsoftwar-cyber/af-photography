import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/routing";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy course-dashboard → homepage (dashboard portal removed)
  if (pathname === "/course-dashboard" || pathname.startsWith("/course-dashboard/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Nuke dashboard landing + portal — send everyone to the public homepage
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Old dashboard course URLs → standalone course space
  const courseMatch = pathname.match(/^\/dashboard\/courses\/([^/]+)\/?$/);
  if (courseMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/course/${courseMatch[1]}`;
    url.search = "";
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
    // Remaining legacy dashboard sections → homepage (no portal)
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Course space requires login
  if (pathname.startsWith("/course/")) {
    const loggedIn = request.cookies.get(SESSION_COOKIE)?.value === "1";
    if (!loggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      url.searchParams.set("auth", "1");
      return NextResponse.redirect(url);
    }
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

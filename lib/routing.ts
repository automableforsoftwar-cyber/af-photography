export const ACTIVATION_COOKIE = "afp_activated";
export const SESSION_COOKIE = "afp_logged_in";

export const DASHBOARD_PROTECTED_PREFIXES = [
  "/dashboard/courses",
  "/dashboard/community",
  "/dashboard/inbox",
  "/dashboard/challenges",
  "/dashboard/gallery",
  "/dashboard/resources",
  "/dashboard/account",
] as const;

/** Post-auth destination — always free browse on main dashboard (no activation jail). */
export function getPostAuthPath(_unlockedCourseIds?: string[]): string {
  void _unlockedCourseIds;
  return "/dashboard";
}

export function syncAuthCookies(input: {
  isLoggedIn: boolean;
  unlockedCount: number;
}) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${SESSION_COOKIE}=${input.isLoggedIn ? "1" : "0"}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  document.cookie = `${ACTIVATION_COOKIE}=${input.unlockedCount > 0 ? "1" : "0"}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=0; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${ACTIVATION_COOKIE}=0; Path=/; Max-Age=0; SameSite=Lax`;
}

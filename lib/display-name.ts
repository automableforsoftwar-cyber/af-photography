/** Prefer profile full_name everywhere — never show anonymous. */
export function pickDisplayName(
  fullName?: string | null,
  email?: string | null,
): string {
  const name = fullName?.trim();
  if (name) return name;
  const local = email?.split("@")[0]?.trim();
  if (local) return local;
  return "عضو";
}

/** ISO timestamp for "now − days" (UTC). */
export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

/** Chat / post visibility window. */
export const RETENTION_DAYS = 3;

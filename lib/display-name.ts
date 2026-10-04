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

/** First two letters of a display name for avatar placeholders. */
export function getInitials(name?: string | null, fallback = "؟"): string {
  const cleaned = (name ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return fallback;
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    const pair = `${a}${b}`;
    return pair || fallback;
  }
  return cleaned.slice(0, 2) || fallback;
}

/** ISO timestamp for "now − days" (UTC). */
export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

/** Chat / post visibility window. */
export const RETENTION_DAYS = 3;

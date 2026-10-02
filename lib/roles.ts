export type UserRole = "instructor" | "organizer" | "student";

export type UserTitle = "المدرب" | "المنظم";

export type ProfileModeration = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  title: string | null;
  is_blocked: boolean;
  is_chat_blocked: boolean;
  created_at?: string;
};

export function normalizeRole(raw: unknown): UserRole {
  if (raw === "instructor" || raw === "organizer" || raw === "student") {
    return raw;
  }
  return "student";
}

export function isStaffRole(role: UserRole | null | undefined): boolean {
  return role === "instructor" || role === "organizer";
}

export function titleForRole(role: UserRole): UserTitle | null {
  if (role === "instructor") return "المدرب";
  if (role === "organizer") return "المنظم";
  return null;
}

export function badgeTone(title: string | null | undefined): "gold" | "blue" | null {
  if (title === "المدرب") return "gold";
  if (title === "المنظم") return "blue";
  return null;
}

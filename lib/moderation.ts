import { modules } from "@/lib/content";
import {
  isStaffRole,
  normalizeRole,
  titleForRole,
  type ProfileModeration,
  type UserRole,
} from "@/lib/roles";
import { supabase } from "@/lib/supabase";

export async function fetchMyProfileFlags(): Promise<{
  role: UserRole;
  title: string | null;
  isBlocked: boolean;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { role: "student", title: null, isBlocked: false };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role, title, is_blocked")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    console.error("fetchMyProfileFlags:", error);
    return { role: "student", title: null, isBlocked: false };
  }

  const role = normalizeRole(data.role);
  return {
    role,
    title: (data.title as string | null)?.trim() || titleForRole(role),
    isBlocked: Boolean(data.is_blocked),
  };
}

export async function fetchProfilesByIds(
  ids: string[],
): Promise<Map<string, Pick<ProfileModeration, "title" | "role" | "is_blocked">>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const map = new Map<
    string,
    Pick<ProfileModeration, "title" | "role" | "is_blocked">
  >();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, title, is_blocked")
    .in("id", unique);

  if (error) {
    console.error("fetchProfilesByIds:", error);
    return map;
  }

  for (const row of data ?? []) {
    const role = normalizeRole(row.role);
    map.set(row.id as string, {
      role,
      title: (row.title as string | null)?.trim() || titleForRole(role),
      is_blocked: Boolean(row.is_blocked),
    });
  }
  return map;
}

export async function deleteCourseMessage(
  messageId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase
    .from("course_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    console.error("deleteCourseMessage:", error);
    return { ok: false, message: "delete_failed" };
  }
  return { ok: true };
}

export async function setUserBlocked(
  userId: string,
  blocked: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const flags = await fetchMyProfileFlags();
  if (!isStaffRole(flags.role) || flags.isBlocked) {
    return { ok: false, message: "forbidden" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_blocked: blocked })
    .eq("id", userId);

  if (error) {
    console.error("setUserBlocked:", error);
    return { ok: false, message: "update_failed" };
  }
  return { ok: true };
}

export type AdminAnalytics = {
  totalUsers: number;
  activeSubscriptions: number;
  byCourse: { courseId: string; courseTitle: string; count: number }[];
};

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const [{ count: totalUsers }, enrollments] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("user_courses")
      .select("course_id, expires_at")
      .gt("expires_at", new Date().toISOString()),
  ]);

  const byCourseMap = new Map<string, number>();
  for (const row of enrollments.data ?? []) {
    const id = row.course_id as string;
    byCourseMap.set(id, (byCourseMap.get(id) ?? 0) + 1);
  }

  const titleById = new Map(modules.map((m) => [m.id, m.title]));
  const byCourse = Array.from(byCourseMap.entries())
    .map(([courseId, count]) => ({
      courseId,
      courseTitle: titleById.get(courseId) ?? courseId,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalUsers: totalUsers ?? 0,
    activeSubscriptions: enrollments.data?.length ?? 0,
    byCourse,
  };
}

export async function fetchAllProfilesForAdmin(): Promise<ProfileModeration[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, title, is_blocked, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchAllProfilesForAdmin:", error);
    return [];
  }

  return ((data ?? []) as ProfileModeration[]).map((p) => {
    const role = normalizeRole(p.role);
    return {
      ...p,
      role,
      title: p.title?.trim() || titleForRole(role),
      is_blocked: Boolean(p.is_blocked),
    };
  });
}

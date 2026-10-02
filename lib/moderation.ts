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
  isChatBlocked: boolean;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      role: "student",
      title: null,
      isBlocked: false,
      isChatBlocked: false,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role, title, is_blocked, is_chat_blocked")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    console.error("fetchMyProfileFlags:", error);
    return {
      role: "student",
      title: null,
      isBlocked: false,
      isChatBlocked: false,
    };
  }

  const role = normalizeRole(data.role);
  return {
    role,
    title: (data.title as string | null)?.trim() || titleForRole(role),
    isBlocked: Boolean(data.is_blocked),
    isChatBlocked: Boolean(data.is_chat_blocked),
  };
}

export async function fetchProfilesByIds(
  ids: string[],
): Promise<
  Map<
    string,
    Pick<
      ProfileModeration,
      "title" | "role" | "is_blocked" | "is_chat_blocked"
    >
  >
> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const map = new Map<
    string,
    Pick<
      ProfileModeration,
      "title" | "role" | "is_blocked" | "is_chat_blocked"
    >
  >();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, title, is_blocked, is_chat_blocked")
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
      is_chat_blocked: Boolean(row.is_chat_blocked),
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

export async function deleteCommunityPost(
  postId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const flags = await fetchMyProfileFlags();
  if (!isStaffRole(flags.role) || flags.isBlocked) {
    return { ok: false, message: "forbidden" };
  }

  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId);

  if (error) {
    console.error("deleteCommunityPost:", error);
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === userId) {
    return { ok: false, message: "forbidden" };
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const targetRole = normalizeRole(target?.role);
  // Only the instructor may block/unblock organizers (or another instructor)
  if (isStaffRole(targetRole) && flags.role !== "instructor") {
    return { ok: false, message: "forbidden" };
  }
  if (targetRole === "instructor") {
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

export async function setUserChatBlocked(
  userId: string,
  chatBlocked: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const flags = await fetchMyProfileFlags();
  if (!isStaffRole(flags.role) || flags.isBlocked) {
    return { ok: false, message: "forbidden" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_chat_blocked: chatBlocked })
    .eq("id", userId);

  if (error) {
    console.error("setUserChatBlocked:", error);
    return { ok: false, message: "update_failed" };
  }
  return { ok: true };
}

/** Instructor only: promote a student to organizer. */
export async function promoteToOrganizer(
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const flags = await fetchMyProfileFlags();
  if (flags.role !== "instructor" || flags.isBlocked) {
    return { ok: false, message: "forbidden" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "organizer", title: "المنظم" })
    .eq("id", userId);

  if (error) {
    console.error("promoteToOrganizer:", error);
    return { ok: false, message: "update_failed" };
  }
  return { ok: true };
}

/** Instructor only: demote an organizer back to student. */
export async function demoteOrganizer(
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const flags = await fetchMyProfileFlags();
  if (flags.role !== "instructor" || flags.isBlocked) {
    return { ok: false, message: "forbidden" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "student", title: null })
    .eq("id", userId);

  if (error) {
    console.error("demoteOrganizer:", error);
    return { ok: false, message: "update_failed" };
  }
  return { ok: true };
}

/** All organizer profiles (for instructor team panel). */
export async function fetchOrganizersForInstructor(): Promise<
  ProfileModeration[]
> {
  const flags = await fetchMyProfileFlags();
  if (flags.role !== "instructor") return [];

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, title, is_blocked, is_chat_blocked, created_at",
    )
    .eq("role", "organizer")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchOrganizersForInstructor:", error);
    return [];
  }

  return ((data ?? []) as ProfileModeration[]).map((p) => {
    const role = normalizeRole(p.role);
    return {
      ...p,
      role,
      title: p.title?.trim() || titleForRole(role),
      is_blocked: Boolean(p.is_blocked),
      is_chat_blocked: Boolean(p.is_chat_blocked),
    };
  });
}

export async function fetchAllProfilesForAdmin(): Promise<ProfileModeration[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, title, is_blocked, is_chat_blocked, created_at",
    )
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
      is_chat_blocked: Boolean(p.is_chat_blocked),
    };
  });
}

/** Subscribed users = profiles that have at least one active user_courses row. */
export async function fetchSubscribedProfilesForAdmin(): Promise<
  ProfileModeration[]
> {
  const since = new Date().toISOString();
  const { data: enrollments, error: enrollError } = await supabase
    .from("user_courses")
    .select("user_id")
    .gt("expires_at", since);

  if (enrollError) {
    console.error("fetchSubscribedProfilesForAdmin enrollments:", enrollError);
    return fetchAllProfilesForAdmin();
  }

  const ids = Array.from(
    new Set((enrollments ?? []).map((r) => r.user_id as string).filter(Boolean)),
  );
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, title, is_blocked, is_chat_blocked, created_at",
    )
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchSubscribedProfilesForAdmin profiles:", error);
    return [];
  }

  return ((data ?? []) as ProfileModeration[]).map((p) => {
    const role = normalizeRole(p.role);
    return {
      ...p,
      role,
      title: p.title?.trim() || titleForRole(role),
      is_blocked: Boolean(p.is_blocked),
      is_chat_blocked: Boolean(p.is_chat_blocked),
    };
  });
}

export type CompetitionLeaderRow = {
  postId: string;
  userId: string;
  displayName: string;
  title: string;
  description: string | null;
  imageUrl: string;
  voteCount: number;
  courseId: string | null;
  courseTitle: string;
};

export async function fetchCompetitionLeaderboard(
  limit = 50,
): Promise<CompetitionLeaderRow[]> {
  const { data, error } = await supabase
    .from("community_posts")
    .select(
      "id, user_id, title, user_name, author_label, description, image_url, vote_count, course_id",
    )
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchCompetitionLeaderboard:", error);
    return [];
  }

  const titleById = new Map(modules.map((m) => [m.id, m.title]));

  return (data ?? []).map((row) => {
    const courseId = (row.course_id as string | null) ?? null;
    return {
      postId: row.id as string,
      userId: row.user_id as string,
      displayName:
        (row.user_name as string | null)?.trim() ||
        (row.author_label as string | null)?.trim() ||
        "عضو",
      title: (row.title as string) || "",
      description: (row.description as string | null) ?? null,
      imageUrl: (row.image_url as string) || "",
      voteCount: Number(row.vote_count ?? 0),
      courseId,
      courseTitle: courseId
        ? (titleById.get(courseId) ?? courseId)
        : "عام",
    };
  });
}

export type StudentProgressRow = {
  userId: string;
  displayName: string;
  email: string | null;
  courseId: string;
  courseTitle: string;
  completedCount: number;
  score: number;
};

export type InstructorAnalytics = {
  progress: StudentProgressRow[];
  hallOfFame: CompetitionLeaderRow[];
  totalStudentsWithProgress: number;
  avgCompletedLessons: number;
};

export async function fetchInstructorAnalytics(): Promise<InstructorAnalytics> {
  const [{ data: progressRows, error: progressError }, hallOfFame] =
    await Promise.all([
      supabase
        .from("user_progress")
        .select("user_id, course_id, completed_lessons, score")
        .order("score", { ascending: false }),
      fetchCompetitionLeaderboard(20),
    ]);

  if (progressError) {
    console.error("fetchInstructorAnalytics progress:", progressError);
  }

  const rows = progressRows ?? [];
  const userIds = Array.from(
    new Set(rows.map((r) => r.user_id as string).filter(Boolean)),
  );

  const nameById = new Map<string, { name: string; email: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      const name =
        (p.full_name as string | null)?.trim() ||
        (p.email as string | null)?.split("@")[0] ||
        "عضو";
      nameById.set(p.id as string, {
        name,
        email: (p.email as string | null) ?? null,
      });
    }
  }

  const titleById = new Map(modules.map((m) => [m.id, m.title]));
  const progress: StudentProgressRow[] = rows.map((r) => {
    const uid = r.user_id as string;
    const courseId = r.course_id as string;
    const completed = Array.isArray(r.completed_lessons)
      ? r.completed_lessons.length
      : 0;
    const meta = nameById.get(uid);
    return {
      userId: uid,
      displayName: meta?.name ?? "عضو",
      email: meta?.email ?? null,
      courseId,
      courseTitle: titleById.get(courseId) ?? courseId,
      completedCount: completed,
      score: Number(r.score ?? 0),
    };
  });

  const avg =
    progress.length === 0
      ? 0
      : progress.reduce((sum, p) => sum + p.completedCount, 0) /
        progress.length;

  return {
    progress,
    hallOfFame,
    totalStudentsWithProgress: new Set(progress.map((p) => p.userId)).size,
    avgCompletedLessons: Math.round(avg * 10) / 10,
  };
}

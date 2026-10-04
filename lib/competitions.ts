import { sendCourseMessage } from "@/lib/course-community";
import { supabase } from "@/lib/supabase";

export type Competition = {
  id: string;
  course_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  max_votes_per_user: number;
  announced_start: boolean;
  announced_end: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CompetitionPhase = "upcoming" | "active" | "ended";

const SELECT =
  "id, course_id, title, starts_at, ends_at, max_votes_per_user, announced_start, announced_end, created_by, created_at, updated_at";

export function competitionPhase(
  c: Pick<Competition, "starts_at" | "ends_at">,
  now = Date.now(),
): CompetitionPhase {
  const start = new Date(c.starts_at).getTime();
  const end = new Date(c.ends_at).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

export async function fetchCompetitionsForCourse(
  courseId: string,
): Promise<Competition[]> {
  const { data, error } = await supabase
    .from("competitions")
    .select(SELECT)
    .eq("course_id", courseId)
    .order("starts_at", { ascending: false });
  if (error) {
    console.error("fetchCompetitionsForCourse:", error.message);
    return [];
  }
  return (data ?? []) as Competition[];
}

export async function fetchActiveCompetitions(): Promise<Competition[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("competitions")
    .select(SELECT)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("starts_at", { ascending: false });
  if (error) {
    console.error("fetchActiveCompetitions:", error.message);
    return [];
  }
  return (data ?? []) as Competition[];
}

export async function fetchLatestCompetition(
  courseId: string,
): Promise<Competition | null> {
  const list = await fetchCompetitionsForCourse(courseId);
  return list[0] ?? null;
}

export async function fetchLatestCompetitionById(
  id: string,
): Promise<Competition | null> {
  const { data, error } = await supabase
    .from("competitions")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("fetchLatestCompetitionById:", error.message);
    return null;
  }
  return (data as Competition | null) ?? null;
}

export async function upsertCompetition(input: {
  id?: string;
  courseId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  maxVotesPerUser: number;
}): Promise<{ ok: true; competition: Competition } | { ok: false; message: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "login_required" };

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { ok: false, message: "invalid_dates" };
  }
  if (endsAt <= startsAt) {
    return { ok: false, message: "end_before_start" };
  }
  const maxVotes = Math.max(1, Math.floor(input.maxVotesPerUser || 1));

  const payload = {
    course_id: input.courseId,
    title: input.title.trim() || "مسابقة التصوير",
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    max_votes_per_user: maxVotes,
    updated_at: new Date().toISOString(),
    created_by: user.id,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("competitions")
      .update(payload)
      .eq("id", input.id)
      .select(SELECT)
      .single();
    if (error || !data) {
      console.error("upsertCompetition update:", error?.message);
      return { ok: false, message: "save_failed" };
    }
    const competition = data as Competition;
    await syncCompetitionAnnouncements(competition);
    return { ok: true, competition };
  }

  const { data, error } = await supabase
    .from("competitions")
    .insert(payload)
    .select(SELECT)
    .single();
  if (error || !data) {
    console.error("upsertCompetition insert:", error?.message);
    return { ok: false, message: "save_failed" };
  }
  const competition = data as Competition;
  await syncCompetitionAnnouncements(competition);
  return { ok: true, competition };
}

async function postAnnouncement(courseId: string, body: string) {
  await sendCourseMessage({
    courseId,
    channelId: "announcements",
    body,
    authorLabel: "نظام المسابقات",
  });
}

/** Announce start/end into #الرسائل when phase transitions. */
export async function syncCompetitionAnnouncements(
  competition: Competition,
): Promise<void> {
  const phase = competitionPhase(competition);
  const patches: Partial<Competition> = {};

  if (phase === "active" && !competition.announced_start) {
    await postAnnouncement(
      competition.course_id,
      `بدأت المسابقة «${competition.title}». التصويت مفتوح دلوقتي — كل عضو يقدر يصوّت حتى ${competition.max_votes_per_user} مرات. تنتهي: ${new Date(competition.ends_at).toLocaleString("ar-EG")}`,
    );
    patches.announced_start = true;
  }

  if (phase === "ended" && !competition.announced_end) {
    await postAnnouncement(
      competition.course_id,
      `انتهت المسابقة «${competition.title}». شكراً لكل المشاركين — تابعوا معرض الفائزين للنتائج.`,
    );
    patches.announced_end = true;
  }

  if (Object.keys(patches).length === 0) return;

  await supabase
    .from("competitions")
    .update({ ...patches, updated_at: new Date().toISOString() })
    .eq("id", competition.id);
}

/** Sweep all competitions for announcement side-effects (safe to call often). */
export async function syncAllCompetitionAnnouncements(): Promise<void> {
  const { data, error } = await supabase.from("competitions").select(SELECT);
  if (error || !data) return;
  for (const row of data as Competition[]) {
    await syncCompetitionAnnouncements(row);
  }
}

export async function countUserVotesInCompetition(
  userId: string,
  competitionId: string,
): Promise<number> {
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id")
    .eq("competition_id", competitionId);
  const ids = (posts ?? []).map((p) => p.id as string);
  if (ids.length === 0) return 0;

  const { count, error } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("post_id", ids);
  if (error) {
    console.error("countUserVotesInCompetition:", error.message);
    return 0;
  }
  return count ?? 0;
}

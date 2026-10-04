import {
  competitionPhase,
  countUserVotesInCompetition,
  fetchActiveCompetitions,
  fetchLatestCompetition,
  fetchLatestCompetitionById,
} from "@/lib/competitions";
import { RETENTION_DAYS, daysAgoIso } from "@/lib/display-name";
import { toCommunityImagePublicUrl } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

export type CommunityPost = {
  id: string;
  user_id: string;
  title: string;
  author_label: string | null;
  user_name: string | null;
  description: string | null;
  image_url: string;
  vote_count: number;
  created_at: string;
  course_id?: string | null;
  competition_id?: string | null;
  voted?: boolean;
};

export type PostSort = "newest" | "votes";

const POST_SELECT =
  "id, user_id, title, author_label, user_name, description, image_url, vote_count, created_at, course_id, competition_id";

export async function fetchCommunityPosts(
  userId?: string | null,
  sort: PostSort = "newest",
  courseId?: string | null,
): Promise<CommunityPost[]> {
  const since = daysAgoIso(RETENTION_DAYS);
  let query = supabase
    .from("community_posts")
    .select(POST_SELECT)
    .gte("created_at", since);

  if (courseId) {
    query = query.eq("course_id", courseId);
  } else {
    query = query.is("course_id", null);
  }

  if (sort === "votes") {
    query = query
      .order("vote_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("community_posts fetch:", error);
    return [];
  }

  const posts = ((data ?? []) as CommunityPost[]).map((p) => ({
    ...p,
    image_url: p.image_url
      ? toCommunityImagePublicUrl(p.image_url)
      : p.image_url,
  }));
  if (!userId || posts.length === 0) return posts;

  const { data: myVotes } = await supabase
    .from("votes")
    .select("post_id")
    .eq("user_id", userId);

  const votedSet = new Set((myVotes ?? []).map((v) => v.post_id as string));
  return posts.map((p) => ({ ...p, voted: votedSet.has(p.id) }));
}

/** Winners = highest votes for a course (or public gallery if courseId null). */
export async function fetchWinners(
  userId?: string | null,
  courseId?: string | null,
  limit = 12,
): Promise<CommunityPost[]> {
  const posts = await fetchCommunityPosts(userId, "votes", courseId);
  return posts.filter((p) => p.vote_count > 0).slice(0, limit);
}

export async function voteOnPost(postId: string): Promise<
  | { ok: true; voteCount: number }
  | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "login_required" };
  }

  const { data: postRow } = await supabase
    .from("community_posts")
    .select("id, vote_count, course_id, competition_id")
    .eq("id", postId)
    .maybeSingle();

  if (!postRow) {
    return { ok: false, message: "vote_failed" };
  }

  let competitionId = (postRow.competition_id as string | null) ?? null;
  let competition = competitionId
    ? await fetchLatestCompetitionById(competitionId)
    : null;

  if (!competition && postRow.course_id) {
    competition = await fetchLatestCompetition(String(postRow.course_id));
    competitionId = competition?.id ?? null;
  }

  if (competition) {
    const phase = competitionPhase(competition);
    if (phase === "upcoming") {
      return { ok: false, message: "not_started" };
    }
    if (phase === "ended") {
      return { ok: false, message: "ended" };
    }
    const used = await countUserVotesInCompetition(user.id, competition.id);
    if (used >= competition.max_votes_per_user) {
      return { ok: false, message: "vote_limit" };
    }
  }

  const { error: voteError } = await supabase.from("votes").insert({
    post_id: postId,
    user_id: user.id,
  });

  if (voteError) {
    if (voteError.code === "23505") {
      return { ok: false, message: "already_voted" };
    }
    console.error("vote insert:", voteError);
    return { ok: false, message: "vote_failed" };
  }

  const next = (Number(postRow.vote_count) || 0) + 1;
  await supabase
    .from("community_posts")
    .update({
      vote_count: next,
      ...(competitionId && !postRow.competition_id
        ? { competition_id: competitionId }
        : {}),
    })
    .eq("id", postId);

  return { ok: true, voteCount: next };
}

/** Active competition entries for the public landing gallery. */
export async function fetchActiveCompetitionPosts(
  userId?: string | null,
): Promise<CommunityPost[]> {
  const active = await fetchActiveCompetitions();
  if (active.length === 0) {
    // Fallback: show recent competition-tagged / course posts
    return fetchCommunityPosts(userId, "votes", null);
  }
  const ids = active.map((c) => c.id);
  const { data, error } = await supabase
    .from("community_posts")
    .select(POST_SELECT)
    .in("competition_id", ids)
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(48);

  if (error) {
    console.error("fetchActiveCompetitionPosts:", error.message);
    // Also include course posts for active competition courses
    const courseIds = [...new Set(active.map((c) => c.course_id))];
    const merged: CommunityPost[] = [];
    for (const courseId of courseIds) {
      merged.push(...(await fetchCommunityPosts(userId, "votes", courseId)));
    }
    return merged;
  }

  let posts = ((data ?? []) as CommunityPost[]).map((p) => ({
    ...p,
    image_url: p.image_url
      ? toCommunityImagePublicUrl(p.image_url)
      : p.image_url,
  }));

  if (posts.length === 0) {
    const courseIds = [...new Set(active.map((c) => c.course_id))];
    for (const courseId of courseIds) {
      posts.push(...(await fetchCommunityPosts(userId, "votes", courseId)));
    }
  }

  if (!userId || posts.length === 0) return posts;
  const { data: myVotes } = await supabase
    .from("votes")
    .select("post_id")
    .eq("user_id", userId);
  const votedSet = new Set((myVotes ?? []).map((v) => v.post_id as string));
  return posts.map((p) => ({ ...p, voted: votedSet.has(p.id) }));
}

export async function uploadCommunityPost(input: {
  title?: string;
  description: string;
  userName: string;
  imageUrl: string;
  courseId?: string | null;
}): Promise<{ ok: true; post: CommunityPost } | { ok: false; message: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "login_required" };
  }

  const userName = input.userName.trim();
  const description = input.description.trim();
  const imageUrl = input.imageUrl.trim()
    ? toCommunityImagePublicUrl(input.imageUrl.trim())
    : "";
  if (!description || !imageUrl) {
    return { ok: false, message: "missing_fields" };
  }

  let resolvedName = userName;
  if (!resolvedName) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    resolvedName =
      (profile?.full_name as string | null)?.trim() ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : "") ||
      (profile?.email as string | null)?.split("@")[0]?.trim() ||
      user.email?.split("@")[0]?.trim() ||
      "عضو";
  }

  const title = (input.title?.trim() || description.slice(0, 80)).trim();

  let competitionId: string | null = null;
  if (input.courseId) {
    const latest = await fetchLatestCompetition(input.courseId);
    if (latest && competitionPhase(latest) === "active") {
      competitionId = latest.id;
    }
  }

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      title,
      description,
      user_name: resolvedName,
      author_label: resolvedName,
      image_url: imageUrl,
      vote_count: 0,
      course_id: input.courseId ?? null,
      competition_id: competitionId,
    })
    .select(POST_SELECT)
    .single();

  if (error || !data) {
    console.error("community_posts insert:", error);
    return { ok: false, message: "upload_failed" };
  }

  return {
    ok: true,
    post: {
      ...(data as CommunityPost),
      image_url: toCommunityImagePublicUrl(
        (data as CommunityPost).image_url,
      ),
    },
  };
}

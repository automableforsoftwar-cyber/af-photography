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
  voted?: boolean;
};

export type PostSort = "newest" | "votes";

const POST_SELECT =
  "id, user_id, title, author_label, user_name, description, image_url, vote_count, created_at, course_id";

export async function fetchCommunityPosts(
  userId?: string | null,
  sort: PostSort = "newest",
  courseId?: string | null,
): Promise<CommunityPost[]> {
  let query = supabase.from("community_posts").select(POST_SELECT);

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

  const posts = (data ?? []) as CommunityPost[];
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

  const { data: post } = await supabase
    .from("community_posts")
    .select("vote_count")
    .eq("id", postId)
    .maybeSingle();

  const next = (post?.vote_count ?? 0) + 1;
  await supabase
    .from("community_posts")
    .update({ vote_count: next })
    .eq("id", postId);

  return { ok: true, voteCount: next };
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
  const imageUrl = input.imageUrl.trim();
  if (!userName || !description || !imageUrl) {
    return { ok: false, message: "missing_fields" };
  }

  const title = (input.title?.trim() || description.slice(0, 80)).trim();

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      title,
      description,
      user_name: userName,
      author_label: userName,
      image_url: imageUrl,
      vote_count: 0,
      course_id: input.courseId ?? null,
    })
    .select(POST_SELECT)
    .single();

  if (error || !data) {
    console.error("community_posts insert:", error);
    return { ok: false, message: "upload_failed" };
  }

  return { ok: true, post: data as CommunityPost };
}

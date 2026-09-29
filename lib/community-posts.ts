import { supabase } from "@/lib/supabase";

export type CommunityPost = {
  id: string;
  user_id: string;
  title: string;
  author_label: string | null;
  image_url: string;
  vote_count: number;
  created_at: string;
  voted?: boolean;
};

export async function fetchCommunityPosts(
  userId?: string | null,
): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, user_id, title, author_label, image_url, vote_count, created_at")
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: false });

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
  title: string;
  imageUrl: string;
  authorLabel?: string;
}): Promise<{ ok: true; post: CommunityPost } | { ok: false; message: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "login_required" };
  }

  const title = input.title.trim();
  const imageUrl = input.imageUrl.trim();
  if (!title || !imageUrl) {
    return { ok: false, message: "missing_fields" };
  }

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      title,
      image_url: imageUrl,
      author_label: input.authorLabel?.trim() || null,
      vote_count: 0,
    })
    .select(
      "id, user_id, title, author_label, image_url, vote_count, created_at",
    )
    .single();

  if (error || !data) {
    console.error("community_posts insert:", error);
    return { ok: false, message: "upload_failed" };
  }

  return { ok: true, post: data as CommunityPost };
}

import { RETENTION_DAYS, daysAgoIso, pickDisplayName } from "@/lib/display-name";
import { supabase } from "@/lib/supabase";

export type DirectMessage = {
  id: string;
  course_id: string;
  sender_id: string;
  sender_name: string | null;
  body: string;
  image_url: string | null;
  created_at: string;
};

export async function fetchMyDirectMessages(
  courseId: string,
): Promise<DirectMessage[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since = daysAgoIso(RETENTION_DAYS);
  const { data, error } = await supabase
    .from("direct_messages")
    .select("id, course_id, sender_id, sender_name, body, image_url, created_at")
    .eq("course_id", courseId)
    .eq("sender_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("direct_messages fetch:", error);
    return [];
  }

  return (data ?? []) as DirectMessage[];
}

export async function sendDirectMessage(input: {
  courseId: string;
  body: string;
  senderName?: string;
  imageUrl?: string | null;
}): Promise<
  { ok: true; message: DirectMessage } | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "login_required" };
  }

  const body = input.body.trim();
  if (!body && !input.imageUrl) {
    return { ok: false, message: "empty" };
  }

  let senderName = input.senderName?.trim() || "";
  if (!senderName) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    senderName = pickDisplayName(
      (profile?.full_name as string | null) ||
        (typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null),
      (profile?.email as string | null) || user.email,
    );
  }

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      course_id: input.courseId,
      sender_id: user.id,
      sender_name: senderName,
      body: body || "(صورة)",
      image_url: input.imageUrl?.trim() || null,
    })
    .select("id, course_id, sender_id, sender_name, body, image_url, created_at")
    .single();

  if (error || !data) {
    console.error("direct_messages insert:", error);
    return { ok: false, message: "send_failed" };
  }

  return { ok: true, message: data as DirectMessage };
}

import { RETENTION_DAYS, daysAgoIso, pickDisplayName } from "@/lib/display-name";
import { fetchMyProfileFlags } from "@/lib/moderation";
import { supabase } from "@/lib/supabase";

/** Amgad / admin contact inbox (student → staff). */
export type AmgadMessage = {
  id: string;
  course_id: string;
  sender_id: string;
  sender_name: string | null;
  body: string;
  image_url: string | null;
  created_at: string;
};

export type AmgadInboxThread = {
  peerUserId: string;
  peerName: string;
  lastMessageAt: string;
  lastBody: string;
  unreadHint: boolean;
};

export async function fetchMyAmgadMessages(
  courseId: string,
): Promise<AmgadMessage[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since = daysAgoIso(RETENTION_DAYS);
  const { data, error } = await supabase
    .from("amgad_messages")
    .select("id, course_id, sender_id, sender_name, body, image_url, created_at")
    .eq("course_id", courseId)
    .eq("sender_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("amgad_messages fetch:", error);
    return [];
  }

  return (data ?? []) as AmgadMessage[];
}

/** Staff: all student contact messages for a course, newest first. */
export async function fetchStaffAmgadInbox(
  courseId: string,
): Promise<AmgadInboxThread[]> {
  const flags = await fetchMyProfileFlags();
  if (flags.role !== "instructor" && flags.role !== "organizer") {
    return [];
  }

  const since = daysAgoIso(RETENTION_DAYS);
  const { data, error } = await supabase
    .from("amgad_messages")
    .select("id, course_id, sender_id, sender_name, body, image_url, created_at")
    .eq("course_id", courseId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("staff amgad inbox:", error);
    return [];
  }

  const byPeer = new Map<string, AmgadInboxThread>();
  for (const row of (data ?? []) as AmgadMessage[]) {
    if (!row.sender_id) continue;
    if (byPeer.has(row.sender_id)) continue;
    byPeer.set(row.sender_id, {
      peerUserId: row.sender_id,
      peerName: row.sender_name?.trim() || "مشترك",
      lastMessageAt: row.created_at,
      lastBody: row.body || "(صورة)",
      unreadHint: true,
    });
  }

  return Array.from(byPeer.values()).sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

export async function sendAmgadMessage(input: {
  courseId: string;
  body: string;
  senderName?: string;
  imageUrl?: string | null;
}): Promise<
  { ok: true; message: AmgadMessage } | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "login_required" };
  }

  const flags = await fetchMyProfileFlags();
  if (flags.isBlocked) {
    return { ok: false, message: "blocked" };
  }
  if (flags.isChatBlocked) {
    return { ok: false, message: "chat_blocked" };
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
    .from("amgad_messages")
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
    console.error("amgad_messages insert:", error);
    return { ok: false, message: "send_failed" };
  }

  return { ok: true, message: data as AmgadMessage };
}

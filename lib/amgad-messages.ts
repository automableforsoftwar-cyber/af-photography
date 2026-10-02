import { RETENTION_DAYS, daysAgoIso, pickDisplayName } from "@/lib/display-name";
import { fetchMyProfileFlags } from "@/lib/moderation";
import { isStaffRole } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

/** Amgad / admin contact inbox (student ↔ staff). */
export type AmgadMessage = {
  id: string;
  course_id: string;
  sender_id: string;
  sender_name: string | null;
  body: string;
  image_url: string | null;
  created_at: string;
  is_from_staff?: boolean;
  recipient_id?: string | null;
};

export type AmgadInboxThread = {
  peerUserId: string;
  peerName: string;
  lastMessageAt: string;
  lastBody: string;
  unreadHint: boolean;
  courseId: string;
};

const AMGAD_SELECT =
  "id, course_id, sender_id, sender_name, body, image_url, created_at, is_from_staff, recipient_id";

export async function fetchMyAmgadMessages(
  courseId: string,
): Promise<AmgadMessage[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since = daysAgoIso(RETENTION_DAYS);
  // Own messages + staff replies addressed to me
  const { data, error } = await supabase
    .from("amgad_messages")
    .select(AMGAD_SELECT)
    .eq("course_id", courseId)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("amgad_messages fetch:", error);
    // Fallback: own sent only (older schema / RLS)
    const fallback = await supabase
      .from("amgad_messages")
      .select(AMGAD_SELECT)
      .eq("course_id", courseId)
      .eq("sender_id", user.id)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (fallback.error) {
      console.error("amgad_messages fetch fallback:", fallback.error);
      return [];
    }
    return (fallback.data ?? []) as AmgadMessage[];
  }

  return (data ?? []) as AmgadMessage[];
}

/** Staff: distinct students who contacted admin (all courses in retention). */
export async function fetchStaffAmgadInbox(
  _courseId?: string,
): Promise<AmgadInboxThread[]> {
  const flags = await fetchMyProfileFlags();
  // Soft gate — RLS is the real auth; still try fetch if flags look staff
  const looksStaff = isStaffRole(flags.role);

  const since = daysAgoIso(RETENTION_DAYS);
  let query = supabase
    .from("amgad_messages")
    .select(AMGAD_SELECT)
    .eq("is_from_staff", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  // Prefer course filter when provided, but never hide cross-course inbox
  // by requiring it — staff inbox is global within retention.
  const { data, error } = await query;

  if (error) {
    console.error("staff amgad inbox:", error);
    // Retry without is_from_staff filter (column may be missing on older caches)
    const retry = await supabase
      .from("amgad_messages")
      .select(
        "id, course_id, sender_id, sender_name, body, image_url, created_at",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    if (retry.error) {
      console.error("staff amgad inbox retry:", retry.error);
      if (!looksStaff) return [];
      return [];
    }
    return groupInboxThreads((retry.data ?? []) as AmgadMessage[]);
  }

  return groupInboxThreads((data ?? []) as AmgadMessage[]);
}

function groupInboxThreads(rows: AmgadMessage[]): AmgadInboxThread[] {
  const byPeer = new Map<string, AmgadInboxThread>();
  for (const row of rows) {
    // Only student-originated contact messages seed the inbox
    if (row.is_from_staff) continue;
    if (!row.sender_id) continue;
    if (byPeer.has(row.sender_id)) continue;
    byPeer.set(row.sender_id, {
      peerUserId: row.sender_id,
      peerName: row.sender_name?.trim() || "مشترك",
      lastMessageAt: row.created_at,
      lastBody: row.body || "(صورة)",
      unreadHint: true,
      courseId: row.course_id,
    });
  }

  return Array.from(byPeer.values()).sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

/** Staff: full thread with one student (their messages + staff replies). */
export async function fetchStaffAmgadThread(
  peerUserId: string,
  courseId?: string,
): Promise<AmgadMessage[]> {
  const since = daysAgoIso(RETENTION_DAYS);
  let q = supabase
    .from("amgad_messages")
    .select(AMGAD_SELECT)
    .or(`sender_id.eq.${peerUserId},recipient_id.eq.${peerUserId}`)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (courseId) {
    q = q.eq("course_id", courseId);
  }

  const { data, error } = await q;
  if (error) {
    console.error("staff amgad thread:", error);
    const fallback = await supabase
      .from("amgad_messages")
      .select(
        "id, course_id, sender_id, sender_name, body, image_url, created_at",
      )
      .eq("sender_id", peerUserId)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (fallback.error) return [];
    return (fallback.data ?? []) as AmgadMessage[];
  }
  return (data ?? []) as AmgadMessage[];
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
      is_from_staff: false,
      recipient_id: null,
    })
    .select(AMGAD_SELECT)
    .single();

  if (error || !data) {
    console.error("amgad_messages insert:", error);
    return { ok: false, message: "send_failed" };
  }

  return { ok: true, message: data as AmgadMessage };
}

/** Staff reply into the Amgad contact thread (visible to the student). */
export async function sendStaffAmgadReply(input: {
  courseId: string;
  recipientId: string;
  body: string;
  imageUrl?: string | null;
}): Promise<
  { ok: true; message: AmgadMessage } | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "login_required" };

  const flags = await fetchMyProfileFlags();
  if (!isStaffRole(flags.role) || flags.isBlocked) {
    return { ok: false, message: "forbidden" };
  }

  const body = input.body.trim();
  if (!body && !input.imageUrl) {
    return { ok: false, message: "empty" };
  }

  const senderName =
    flags.title?.trim() ||
    (flags.role === "instructor" ? "المدرب" : "المنظم");

  const { data, error } = await supabase
    .from("amgad_messages")
    .insert({
      course_id: input.courseId,
      sender_id: user.id,
      sender_name: senderName,
      body: body || "(صورة)",
      image_url: input.imageUrl?.trim() || null,
      is_from_staff: true,
      recipient_id: input.recipientId,
    })
    .select(AMGAD_SELECT)
    .single();

  if (error || !data) {
    console.error("staff amgad reply:", error);
    return { ok: false, message: "send_failed" };
  }

  return { ok: true, message: data as AmgadMessage };
}

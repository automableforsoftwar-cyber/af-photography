import { RETENTION_DAYS, daysAgoIso, pickDisplayName } from "@/lib/display-name";
import { fetchMyProfileFlags } from "@/lib/moderation";
import { toCommunityImagePublicUrl } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/** emoji → list of user ids who reacted */
export type MessageReactions = Record<string, string[]>;

export type CourseChatMessage = {
  id: string;
  course_id: string;
  channel_id: string;
  user_id: string;
  author_label: string | null;
  body: string;
  image_url: string | null;
  created_at: string;
  reply_to_id: string | null;
  reactions: MessageReactions;
  /** From profiles.title join */
  author_title?: string | null;
  author_role?: string | null;
  /** Resolved parent snippet for quote UI (client-side). */
  reply_to?: {
    id: string;
    author_label: string | null;
    body: string;
  } | null;
};

export type CommunityChannel = {
  id: string;
  name: string;
  topic: string;
};

const MESSAGE_SELECT =
  "id, course_id, channel_id, user_id, author_label, body, image_url, created_at, reply_to_id, reactions, profiles!course_messages_user_id_fkey(role, title)";

/** Course community channels (isolated per course_id in DB). */
export const channels: CommunityChannel[] = [
  {
    id: "general",
    name: "عام",
    topic: "نقاش نصي عام عن الكورس والدروس",
  },
  {
    id: "announcements",
    name: "الرسائل",
    topic: "رسائل وإعلانات رسمية من الإدارة — للطلاب للقراءة فقط",
  },
  {
    id: "photos",
    name: "الصور",
    topic: "شارك فريماتك واطلب رأي الزملاء",
  },
];

export const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "👏"] as const;

function normalizeReactions(raw: unknown): MessageReactions {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: MessageReactions = {};
  for (const [emoji, users] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(users)) {
      out[emoji] = users.filter((u): u is string => typeof u === "string");
    }
  }
  return out;
}

function attachReplyParents(rows: CourseChatMessage[]): CourseChatMessage[] {
  const byId = new Map(rows.map((m) => [m.id, m]));
  return rows.map((m) => {
    if (!m.reply_to_id) return { ...m, reply_to: null };
    const parent = byId.get(m.reply_to_id);
    if (!parent) return { ...m, reply_to: null };
    return {
      ...m,
      reply_to: {
        id: parent.id,
        author_label: parent.author_label,
        body: parent.body,
      },
    };
  });
}

export async function fetchCourseMessages(input: {
  courseId: string;
  channelId: string;
}): Promise<CourseChatMessage[]> {
  const since = daysAgoIso(RETENTION_DAYS);
  const base = supabase
    .from("course_messages")
    .select(MESSAGE_SELECT)
    .eq("course_id", input.courseId)
    .eq("channel_id", input.channelId)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  let { data, error } = await base;

  // If embed/join fails, fall back to plain rows so chat still loads
  if (error) {
    console.error("course_messages fetch (with profiles):", error);
    const fallback = await supabase
      .from("course_messages")
      .select(
        "id, course_id, channel_id, user_id, author_label, body, image_url, created_at, reply_to_id, reactions",
      )
      .eq("course_id", input.courseId)
      .eq("channel_id", input.channelId)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    data = fallback.data as typeof data;
    error = fallback.error;
    if (error) {
      console.error("course_messages fetch:", error);
      return [];
    }
  }

  const rows = ((data ?? []) as Array<
    CourseChatMessage & {
      profiles?: { role?: string | null; title?: string | null } | null;
    }
  >).map((m) => {
    const profile = m.profiles;
    const author_role = profile?.role ?? null;
    const author_title =
      profile?.title?.trim() ||
      (author_role === "instructor"
        ? "المدرب"
        : author_role === "organizer"
          ? "المنظم"
          : null);
    const { profiles: _ignored, ...rest } = m;
    return {
      ...rest,
      image_url: m.image_url ? toCommunityImagePublicUrl(m.image_url) : null,
      reply_to_id: m.reply_to_id ?? null,
      reactions: normalizeReactions(m.reactions),
      author_title,
      author_role,
    };
  });

  return attachReplyParents(rows);
}

async function resolveAuthorName(
  userId: string,
  fallback?: string | null,
  email?: string | null,
): Promise<string> {
  const fromInput = fallback?.trim();
  if (fromInput) return fromInput;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  return pickDisplayName(
    profile?.full_name as string | null,
    (profile?.email as string | null) || email,
  );
}

export async function sendCourseMessage(input: {
  courseId: string;
  channelId: string;
  body: string;
  authorLabel?: string;
  imageUrl?: string | null;
  replyToId?: string | null;
}): Promise<
  { ok: true; message: CourseChatMessage } | { ok: false; message: string }
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

  // Announcements / #الرسائل: staff only
  if (
    input.channelId === "announcements" ||
    input.channelId === "messages" ||
    input.channelId === "الرسائل" ||
    input.channelId === "الإعلانات"
  ) {
    if (flags.role !== "instructor" && flags.role !== "organizer") {
      return { ok: false, message: "read_only" };
    }
  }

  const body = input.body.trim();
  const imageUrl = input.imageUrl?.trim()
    ? toCommunityImagePublicUrl(input.imageUrl.trim())
    : null;
  if (!body && !imageUrl) {
    return { ok: false, message: "empty" };
  }

  const authorLabel = await resolveAuthorName(
    user.id,
    input.authorLabel,
    user.email,
  );

  const { data, error } = await supabase
    .from("course_messages")
    .insert({
      course_id: input.courseId,
      channel_id: input.channelId,
      user_id: user.id,
      author_label: authorLabel,
      body: body,
      image_url: imageUrl,
      reply_to_id: input.replyToId || null,
      reactions: {},
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error || !data) {
    console.error("course_messages insert:", error);
    return { ok: false, message: "send_failed" };
  }

  const message: CourseChatMessage = {
    ...(data as CourseChatMessage),
    image_url: (data as CourseChatMessage).image_url
      ? toCommunityImagePublicUrl((data as CourseChatMessage).image_url as string)
      : null,
    reactions: normalizeReactions((data as CourseChatMessage).reactions),
    reply_to: null,
  };

  if (message.reply_to_id) {
    const { data: parent } = await supabase
      .from("course_messages")
      .select("id, author_label, body")
      .eq("id", message.reply_to_id)
      .maybeSingle();
    if (parent) {
      message.reply_to = {
        id: parent.id as string,
        author_label: parent.author_label as string | null,
        body: parent.body as string,
      };
    }
  }

  return { ok: true, message };
}

/** Toggle an emoji reaction for the current user on a message. */
export async function toggleMessageReaction(
  messageId: string,
  emoji: string,
): Promise<
  | { ok: true; reactions: MessageReactions }
  | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "login_required" };
  }

  const clean = emoji.trim();
  if (!clean) return { ok: false, message: "empty" };

  const { data: row, error: fetchError } = await supabase
    .from("course_messages")
    .select("reactions")
    .eq("id", messageId)
    .maybeSingle();

  if (fetchError || !row) {
    console.error("reactions fetch:", fetchError);
    return { ok: false, message: "not_found" };
  }

  const current = normalizeReactions(row.reactions);
  const users = new Set(current[clean] ?? []);
  if (users.has(user.id)) {
    users.delete(user.id);
  } else {
    users.add(user.id);
  }

  const next: MessageReactions = { ...current };
  if (users.size === 0) {
    delete next[clean];
  } else {
    next[clean] = Array.from(users);
  }

  const { error: updateError } = await supabase
    .from("course_messages")
    .update({ reactions: next })
    .eq("id", messageId);

  if (updateError) {
    console.error("reactions update:", updateError);
    return { ok: false, message: "update_failed" };
  }

  return { ok: true, reactions: next };
}

export function formatMessageTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("ar-EG", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function mapRawCourseMessage(row: Record<string, unknown>): CourseChatMessage {
  const reactions = normalizeReactions(row.reactions);
  const imageRaw = (row.image_url as string | null) ?? null;
  return {
    id: String(row.id),
    course_id: String(row.course_id),
    channel_id: String(row.channel_id),
    user_id: String(row.user_id),
    author_label: (row.author_label as string | null) ?? null,
    body: String(row.body ?? ""),
    image_url: imageRaw ? toCommunityImagePublicUrl(imageRaw) : null,
    created_at: String(row.created_at),
    reply_to_id: (row.reply_to_id as string | null) ?? null,
    reactions,
    author_title: null,
    author_role: null,
    reply_to: null,
  };
}

/**
 * Live INSERT/UPDATE/DELETE for a course channel.
 * Returns unsubscribe.
 */
export function subscribeCourseMessages(input: {
  courseId: string;
  channelId: string;
  onInsert: (message: CourseChatMessage) => void;
  onUpdate?: (message: CourseChatMessage) => void;
  onDelete?: (messageId: string) => void;
}): () => void {
  const channelName = `course-chat:${input.courseId}:${input.channelId}:${Date.now()}`;
  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "course_messages",
        filter: `course_id=eq.${input.courseId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (!row?.id) return;
        if (String(row.channel_id) !== input.channelId) return;
        input.onInsert(mapRawCourseMessage(row));
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "course_messages",
        filter: `course_id=eq.${input.courseId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (!row?.id || !input.onUpdate) return;
        if (String(row.channel_id) !== input.channelId) return;
        input.onUpdate(mapRawCourseMessage(row));
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "course_messages",
        filter: `course_id=eq.${input.courseId}`,
      },
      (payload) => {
        const row = payload.old as Record<string, unknown>;
        if (!row?.id || !input.onDelete) return;
        input.onDelete(String(row.id));
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

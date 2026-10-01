import { supabase } from "@/lib/supabase";

export type CourseChatMessage = {
  id: string;
  course_id: string;
  channel_id: string;
  user_id: string;
  author_label: string | null;
  body: string;
  image_url: string | null;
  created_at: string;
};

export type CommunityChannel = {
  id: string;
  name: string;
  topic: string;
};

/** Course community — exactly two channels (isolated per course_id in DB). */
export const channels: CommunityChannel[] = [
  {
    id: "general",
    name: "عام",
    topic: "نقاش نصي عام عن الكورس والدروس",
  },
  {
    id: "photos",
    name: "الصور",
    topic: "شارك فريماتك واطلب رأي الزملاء",
  },
];

export async function fetchCourseMessages(input: {
  courseId: string;
  channelId: string;
}): Promise<CourseChatMessage[]> {
  const { data, error } = await supabase
    .from("course_messages")
    .select(
      "id, course_id, channel_id, user_id, author_label, body, image_url, created_at",
    )
    .eq("course_id", input.courseId)
    .eq("channel_id", input.channelId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("course_messages fetch:", error);
    return [];
  }

  return (data ?? []) as CourseChatMessage[];
}

export async function sendCourseMessage(input: {
  courseId: string;
  channelId: string;
  body: string;
  authorLabel?: string;
  imageUrl?: string | null;
}): Promise<
  { ok: true; message: CourseChatMessage } | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "login_required" };
  }

  const body = input.body.trim();
  if (!body) {
    return { ok: false, message: "empty" };
  }

  const { data, error } = await supabase
    .from("course_messages")
    .insert({
      course_id: input.courseId,
      channel_id: input.channelId,
      user_id: user.id,
      author_label: input.authorLabel?.trim() || null,
      body,
      image_url: input.imageUrl?.trim() || null,
    })
    .select(
      "id, course_id, channel_id, user_id, author_label, body, image_url, created_at",
    )
    .single();

  if (error || !data) {
    console.error("course_messages insert:", error);
    return { ok: false, message: "send_failed" };
  }

  return { ok: true, message: data as CourseChatMessage };
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

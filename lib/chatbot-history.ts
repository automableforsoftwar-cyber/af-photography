import { supabase } from "@/lib/supabase";
import type { AssistantContext } from "@/lib/n8n-assistant";

export type ChatbotHistoryMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  session_id: string;
  created_at: string;
};

/** Load persisted assistant turns for this user/scope/course (oldest → newest). */
export async function fetchChatbotHistory(input: {
  userId: string;
  scope: AssistantContext;
  courseId?: string;
}): Promise<ChatbotHistoryMessage[]> {
  if (!input.userId) return [];

  let query = supabase
    .from("chatbot_messages")
    .select("id, role, content, session_id, created_at")
    .eq("user_id", input.userId)
    .eq("scope", input.scope)
    .order("created_at", { ascending: true })
    .limit(200);

  if (input.courseId) {
    query = query.eq("course_id", input.courseId);
  } else {
    query = query.is("course_id", null);
  }

  const { data, error } = await query;
  if (error) {
    console.error("fetchChatbotHistory:", error.message);
    return [];
  }
  return (data ?? []) as ChatbotHistoryMessage[];
}

/** Upsert the n8n Session ID for this user/scope/course. */
export async function upsertChatbotSession(input: {
  userId: string;
  scope: AssistantContext;
  courseId?: string | null;
  sessionId: string;
}): Promise<void> {
  if (!input.userId || !input.sessionId.trim()) return;

  const row = {
    user_id: input.userId,
    scope: input.scope,
    course_id: input.courseId ?? null,
    session_id: input.sessionId.trim(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("chatbot_sessions").upsert(row, {
    onConflict: "user_id,scope,course_id",
  });
  if (error) {
    console.error("upsertChatbotSession:", error.message);
  }
}

/** Persist one chat turn (user or assistant). */
export async function saveChatbotMessage(input: {
  userId: string;
  scope: AssistantContext;
  courseId?: string | null;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
}): Promise<void> {
  const content = input.content.trim();
  if (!input.userId || !content || !input.sessionId.trim()) return;

  const { error } = await supabase.from("chatbot_messages").insert({
    user_id: input.userId,
    scope: input.scope,
    course_id: input.courseId ?? null,
    session_id: input.sessionId.trim(),
    role: input.role,
    content,
  });
  if (error) {
    console.error("saveChatbotMessage:", error.message);
  }
}

/** Resolve stored Session ID from Supabase (falls back to null). */
export async function fetchChatbotSessionId(input: {
  userId: string;
  scope: AssistantContext;
  courseId?: string;
}): Promise<string | null> {
  if (!input.userId) return null;

  let query = supabase
    .from("chatbot_sessions")
    .select("session_id")
    .eq("user_id", input.userId)
    .eq("scope", input.scope)
    .limit(1);

  if (input.courseId) {
    query = query.eq("course_id", input.courseId);
  } else {
    query = query.is("course_id", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("fetchChatbotSessionId:", error.message);
    return null;
  }
  return data?.session_id?.trim() || null;
}

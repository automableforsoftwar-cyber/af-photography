/**
 * n8n Learning / Community Assistant client.
 * Webhook expects: { message, session_id, context?, course_id? }
 * Responds with: { message, session_id }
 */

const DEFAULT_WEBHOOK =
  "https://n8n.srv1960854.hstgr.cloud/webhook/smart-ops-chat";

export type AssistantContext = "learning" | "community";

export type AssistantReply = {
  ok: true;
  message: string;
  sessionId: string;
} | {
  ok: false;
  message: string;
  sessionId: string | null;
};

function webhookUrl(): string {
  return (
    process.env.NEXT_PUBLIC_N8N_ASSISTANT_WEBHOOK?.trim() || DEFAULT_WEBHOOK
  );
}

function storageKey(scope: AssistantContext, userId: string, courseId?: string) {
  const course = courseId ? `:${courseId}` : "";
  return `afp-n8n-session:${scope}${course}:${userId || "anon"}`;
}

/** Load or create a stable Session ID for conversational memory. */
export function getOrCreateAssistantSessionId(input: {
  scope: AssistantContext;
  userId: string;
  courseId?: string;
}): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }
  const key = storageKey(input.scope, input.userId, input.courseId);
  try {
    const existing = window.localStorage.getItem(key)?.trim();
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(key, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export function persistAssistantSessionId(input: {
  scope: AssistantContext;
  userId: string;
  courseId?: string;
  sessionId: string;
}): void {
  if (typeof window === "undefined") return;
  const sid = input.sessionId.trim();
  if (!sid) return;
  try {
    window.localStorage.setItem(
      storageKey(input.scope, input.userId, input.courseId),
      sid,
    );
  } catch {
    /* ignore quota */
  }
}

/**
 * Send a chat turn to n8n and store the returned Session ID for memory.
 */
export async function sendAssistantMessage(input: {
  message: string;
  scope: AssistantContext;
  userId: string;
  courseId?: string;
  sessionId?: string;
  imageDataUrl?: string | null;
}): Promise<AssistantReply> {
  const text = input.message.trim();
  if (!text && !input.imageDataUrl) {
    return { ok: false, message: "اكتب رسالة الأول.", sessionId: null };
  }

  let sessionId =
    input.sessionId?.trim() ||
    getOrCreateAssistantSessionId({
      scope: input.scope,
      userId: input.userId,
      courseId: input.courseId,
    });

  // Scope-prefix keeps Community vs Learning memory separate in n8n Simple Memory
  const scopedSessionId = sessionId.includes(":")
    ? sessionId
    : `${input.scope}:${sessionId}`;

  const body: Record<string, string> = {
    message: text,
    session_id: scopedSessionId,
    context: input.scope,
  };
  if (input.courseId) body.course_id = input.courseId;
  if (input.imageDataUrl) body.image = input.imageDataUrl;

  try {
    const res = await fetch(webhookUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = (await res.json().catch(() => null)) as
      | { message?: string; session_id?: string; output?: string; error?: string }
      | null;

    if (!res.ok) {
      return {
        ok: false,
        message: "المساعد مش متاح دلوقتي. حاول تاني بعد شوية.",
        sessionId: scopedSessionId,
      };
    }

    const replyText =
      raw?.message?.trim() ||
      raw?.output?.trim() ||
      "تعذر توليد الرد حالياً. حاول مرة أخرى.";

    const returnedSid = raw?.session_id?.trim() || scopedSessionId;
    sessionId = returnedSid;
    persistAssistantSessionId({
      scope: input.scope,
      userId: input.userId,
      courseId: input.courseId,
      sessionId,
    });

    return { ok: true, message: replyText, sessionId };
  } catch (error) {
    console.error("n8n assistant:", error);
    return {
      ok: false,
      message: "مقدرناش نوصل للمساعد. تأكد من الاتصال وحاول تاني.",
      sessionId: scopedSessionId,
    };
  }
}

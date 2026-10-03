/**
 * n8n Learning / Community Assistant client.
 *
 * Strict workflow mapping (by exact n8n workflow name):
 * - community → "chat bot انسان بعين مصور"  → /webhook/afp-community-chatbot
 * - learning  → "assisted chatbot بداية"   → /webhook/afp-learning-chatbot
 *
 * Payload: { message, session_id, context, course_id?, workflow_name }
 * Response: { message, session_id }
 */

export type AssistantContext = "learning" | "community";

export type AssistantReply =
  | {
      ok: true;
      message: string;
      sessionId: string;
    }
  | {
      ok: false;
      message: string;
      sessionId: string | null;
    };

/** Exact n8n workflow names required by product. */
export const N8N_WORKFLOW_NAMES = {
  community: "chat bot انسان بعين مصور",
  learning: "assisted chatbot بداية",
} as const;

const N8N_BASE = "https://n8n.srv1960854.hstgr.cloud/webhook";

const DEFAULT_WEBHOOKS: Record<AssistantContext, string> = {
  community: `${N8N_BASE}/afp-community-chatbot`,
  learning: `${N8N_BASE}/afp-learning-chatbot`,
};

function webhookUrl(scope: AssistantContext): string {
  if (scope === "community") {
    return (
      process.env.NEXT_PUBLIC_N8N_COMMUNITY_WEBHOOK?.trim() ||
      DEFAULT_WEBHOOKS.community
    );
  }
  return (
    process.env.NEXT_PUBLIC_N8N_LEARNING_WEBHOOK?.trim() ||
    DEFAULT_WEBHOOKS.learning
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
 * Send a chat turn to the scope-specific n8n workflow and store Session ID.
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

  const workflowName = N8N_WORKFLOW_NAMES[input.scope];

  const body: Record<string, string> = {
    message: text,
    session_id: sessionId,
    context: input.scope,
    workflow_name: workflowName,
  };
  if (input.courseId) body.course_id = input.courseId;
  if (input.imageDataUrl) body.image = input.imageDataUrl;

  try {
    const res = await fetch(webhookUrl(input.scope), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = (await res.json().catch(() => null)) as {
      message?: string;
      session_id?: string;
      output?: string;
      error?: string;
    } | null;

    if (!res.ok) {
      return {
        ok: false,
        message: "المساعد مش متاح دلوقتي. حاول تاني بعد شوية.",
        sessionId,
      };
    }

    const replyText =
      raw?.message?.trim() ||
      raw?.output?.trim() ||
      "تعذر توليد الرد حالياً. حاول مرة أخرى.";

    const returnedSid = raw?.session_id?.trim() || sessionId;
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
      sessionId,
    };
  }
}

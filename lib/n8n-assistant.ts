/**
 * n8n Learning / Community Assistant client.
 *
 * Strict workflow mapping:
 * - Community scope → "chat bot انسان بعين مصور" → /webhook/afp-community-chatbot
 * - Course "بدايه رحلتك الذكيه" (id: smart-start) → "assisted chatbot بداية"
 *   → /webhook/afp-learning-chatbot
 *
 * Payload (learning / smart-start):
 *   { message, session_id, user_id, course_name, course_id?, context, workflow_name }
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
  learningSmartStart: "assisted chatbot بداية",
} as const;

/** Canonical course linked to "assisted chatbot بداية". */
export const SMART_START_COURSE = {
  id: "smart-start",
  /** Product / n8n label (user spelling). */
  name: "بدايه رحلتك الذكيه",
  /** Title as stored in lib/content.ts */
  contentTitle: "بداية رحلتك الذكية",
} as const;

const N8N_BASE = "https://n8n.srv1960854.hstgr.cloud/webhook";

const WEBHOOKS = {
  community: `${N8N_BASE}/afp-community-chatbot`,
  learningSmartStart: `${N8N_BASE}/afp-learning-chatbot`,
} as const;

/** Normalize Arabic alef/ya variants for title matching. */
function normalizeArabicTitle(value: string): string {
  return value
    .trim()
    .replace(/[\u0640]/g, "") // tatweel
    .replace(/[أإآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}

/** True when the active course is «بدايه رحلتك الذكيه» / smart-start. */
export function isSmartStartCourse(input: {
  courseId?: string | null;
  courseName?: string | null;
}): boolean {
  if (input.courseId?.trim() === SMART_START_COURSE.id) return true;
  const name = input.courseName?.trim();
  if (!name) return false;
  const normalized = normalizeArabicTitle(name);
  return (
    normalized === normalizeArabicTitle(SMART_START_COURSE.name) ||
    normalized === normalizeArabicTitle(SMART_START_COURSE.contentTitle)
  );
}

function resolveRoute(input: {
  scope: AssistantContext;
  courseId?: string;
  courseName?: string;
}): {
  webhookUrl: string;
  workflowName: string;
  courseNameForPayload: string | null;
} {
  // Community chatbot — always the community workflow
  if (input.scope === "community") {
    return {
      webhookUrl:
        process.env.NEXT_PUBLIC_N8N_COMMUNITY_WEBHOOK?.trim() ||
        WEBHOOKS.community,
      workflowName: N8N_WORKFLOW_NAMES.community,
      courseNameForPayload: null,
    };
  }

  // Course «بدايه رحلتك الذكيه» → assisted chatbot بداية (strict)
  if (
    isSmartStartCourse({
      courseId: input.courseId,
      courseName: input.courseName,
    })
  ) {
    return {
      webhookUrl:
        process.env.NEXT_PUBLIC_N8N_LEARNING_WEBHOOK?.trim() ||
        WEBHOOKS.learningSmartStart,
      workflowName: N8N_WORKFLOW_NAMES.learningSmartStart,
      courseNameForPayload: SMART_START_COURSE.name,
    };
  }

  // Learning fallback: still use the Start Learning webhook when no other map exists
  return {
    webhookUrl:
      process.env.NEXT_PUBLIC_N8N_LEARNING_WEBHOOK?.trim() ||
      WEBHOOKS.learningSmartStart,
    workflowName: N8N_WORKFLOW_NAMES.learningSmartStart,
    courseNameForPayload: input.courseName?.trim() || null,
  };
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
 * Send a chat turn to the correct n8n workflow and store Session ID.
 */
export async function sendAssistantMessage(input: {
  message: string;
  scope: AssistantContext;
  userId: string;
  courseId?: string;
  courseName?: string;
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

  const route = resolveRoute({
    scope: input.scope,
    courseId: input.courseId,
    courseName: input.courseName,
  });

  const body: Record<string, string> = {
    message: text,
    session_id: sessionId,
    user_id: input.userId || "anon",
    context: input.scope,
    workflow_name: route.workflowName,
  };

  if (input.courseId) body.course_id = input.courseId;
  if (route.courseNameForPayload) {
    body.course_name = route.courseNameForPayload;
  } else if (input.courseName?.trim()) {
    body.course_name = input.courseName.trim();
  }
  if (input.imageDataUrl) body.image = input.imageDataUrl;

  try {
    const res = await fetch(route.webhookUrl, {
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

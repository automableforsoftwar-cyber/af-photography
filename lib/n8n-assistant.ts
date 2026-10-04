/**
 * Strict per-COURSE n8n routing (not by UI scope):
 *
 *  a) "إنسان بعين مصور" (photographer-eye)
 *     → workflow "chat bot انسان بعين مصور"
 *     → POST /webhook/afp-community-chatbot
 *
 *  b) "بدايه رحلتك الذكيه" (smart-start)
 *     → workflow "assisted chatbot بداية"
 *     → POST /webhook/afp-learning-chatbot
 *
 * Payload always includes: message, session_id, user_id
 * (+ course_id, course_name, workflow_name, context when known)
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

export type AssistantRouteKey = "photographerEye" | "smartStart";

/** Exact n8n workflow names. */
export const N8N_WORKFLOW_NAMES = {
  photographerEye: "chat bot انسان بعين مصور",
  smartStart: "assisted chatbot بداية",
} as const;

/** Course «بدايه رحلتك الذكيه» → assisted chatbot بداية */
export const SMART_START_COURSE = {
  id: "smart-start",
  name: "بدايه رحلتك الذكيه",
  contentTitle: "بداية رحلتك الذكية",
} as const;

/** Course «إنسان بعين مصور» → chat bot انسان بعين مصور */
export const PHOTOGRAPHER_EYE_COURSE = {
  id: "photographer-eye",
  name: "إنسان بعين مصور",
  contentTitle: "إنسان بعين مصور",
} as const;

const N8N_BASE = "https://n8n.srv1960854.hstgr.cloud/webhook";

const WEBHOOKS: Record<AssistantRouteKey, string> = {
  photographerEye: `${N8N_BASE}/afp-community-chatbot`,
  smartStart: `${N8N_BASE}/afp-learning-chatbot`,
};

/** Normalize Arabic alef/ya/taa-marbuta for title matching. */
function normalizeArabicTitle(value: string): string {
  return value
    .trim()
    .replace(/[\u0640]/g, "")
    .replace(/[أإآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}

function titleMatches(candidate: string | null | undefined, ...aliases: string[]) {
  if (!candidate?.trim()) return false;
  const n = normalizeArabicTitle(candidate);
  return aliases.some((a) => n === normalizeArabicTitle(a));
}

export function isSmartStartCourse(input: {
  courseId?: string | null;
  courseName?: string | null;
}): boolean {
  if (input.courseId?.trim() === SMART_START_COURSE.id) return true;
  return titleMatches(
    input.courseName,
    SMART_START_COURSE.name,
    SMART_START_COURSE.contentTitle,
  );
}

export function isPhotographerEyeCourse(input: {
  courseId?: string | null;
  courseName?: string | null;
}): boolean {
  if (input.courseId?.trim() === PHOTOGRAPHER_EYE_COURSE.id) return true;
  return titleMatches(
    input.courseName,
    PHOTOGRAPHER_EYE_COURSE.name,
    PHOTOGRAPHER_EYE_COURSE.contentTitle,
    "انسان بعين مصور",
  );
}

/**
 * Resolve webhook STRICTLY from the active course.
 * UI scope (community vs learning) does NOT pick the workflow.
 */
export function resolveAssistantRoute(input: {
  courseId?: string;
  courseName?: string;
}): {
  key: AssistantRouteKey;
  webhookUrl: string;
  workflowName: string;
  courseNameForPayload: string;
  courseIdForPayload: string;
} {
  if (
    isSmartStartCourse({
      courseId: input.courseId,
      courseName: input.courseName,
    })
  ) {
    return {
      key: "smartStart",
      webhookUrl:
        process.env.NEXT_PUBLIC_N8N_SMART_START_WEBHOOK?.trim() ||
        process.env.NEXT_PUBLIC_N8N_LEARNING_WEBHOOK?.trim() ||
        WEBHOOKS.smartStart,
      workflowName: N8N_WORKFLOW_NAMES.smartStart,
      courseNameForPayload: SMART_START_COURSE.name,
      courseIdForPayload: SMART_START_COURSE.id,
    };
  }

  // Default / explicit: إنسان بعين مصور
  return {
    key: "photographerEye",
    webhookUrl:
      process.env.NEXT_PUBLIC_N8N_PHOTOGRAPHER_WEBHOOK?.trim() ||
      process.env.NEXT_PUBLIC_N8N_COMMUNITY_WEBHOOK?.trim() ||
      WEBHOOKS.photographerEye,
    workflowName: N8N_WORKFLOW_NAMES.photographerEye,
    courseNameForPayload: PHOTOGRAPHER_EYE_COURSE.name,
    courseIdForPayload:
      input.courseId?.trim() || PHOTOGRAPHER_EYE_COURSE.id,
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
 * Send a chat turn to the course-specific n8n workflow and store Session ID.
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

  const route = resolveAssistantRoute({
    courseId: input.courseId,
    courseName: input.courseName,
  });

  const body: Record<string, string> = {
    message: text,
    session_id: sessionId,
    user_id: input.userId || "anon",
    context: input.scope,
    workflow_name: route.workflowName,
    course_name: route.courseNameForPayload,
    course_id: input.courseId?.trim() || route.courseIdForPayload,
  };
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

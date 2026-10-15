"use client";

import { useEffect, useRef, useState } from "react";
import type { CourseModule } from "@/lib/content";
import { useAuthStore } from "@/lib/auth-store";
import {
  fetchChatbotHistory,
  fetchChatbotSessionId,
  saveChatbotMessage,
  upsertChatbotSession,
} from "@/lib/chatbot-history";
import {
  getOrCreateAssistantSessionId,
  persistAssistantSessionId,
  sendAssistantMessage,
  type AssistantContext,
  resolveAssistantRoute,
} from "@/lib/n8n-assistant";
import { uploadAssistantMedia } from "@/lib/storage";

type Msg = {
  id: string;
  role: "ai" | "user";
  text: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
};

function welcomeText(scope: AssistantContext, courseTitle: string) {
  return scope === "community"
    ? `أهلاً بيك في مساعد المجتمع لمسار «${courseTitle}». اسأل عن الدروس، التصوير، أو أي فكرة — وهرد عليك فوراً.`
    : `أهلاً بيك في مسار «${courseTitle}». هنا بتتعلّم بالمحادثة — اسألني عن أي مفهوم، تمرين، أو فكرة، وهجاوبك باللهجة المصرية وبخطوات واضحة.`;
}

type AiLearningChatProps = {
  course: CourseModule;
  /** community = Community only; learning = Start Learning (CourseRoom) only */
  scope?: AssistantContext;
  onBackToCommunity?: () => void;
};

export function AiLearningChat({
  course,
  scope = "learning",
  onBackToCommunity,
}: AiLearningChatProps) {
  const userId = useAuthStore((s) => s.userId) ?? "";
  const [sessionId, setSessionId] = useState(() =>
    getOrCreateAssistantSessionId({
      scope,
      userId: userId || "anon",
      courseId: course.id,
    }),
  );
  const [messages, setMessages] = useState<Msg[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [draft, setDraft] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setHistoryReady(false);

      const localSid = getOrCreateAssistantSessionId({
        scope,
        userId: userId || "anon",
        courseId: course.id,
      });

      let sid = localSid;
      if (userId) {
        const stored = await fetchChatbotSessionId({
          userId,
          scope,
          courseId: course.id,
        });
        if (stored) {
          sid = stored;
          persistAssistantSessionId({
            scope,
            userId,
            courseId: course.id,
            sessionId: stored,
          });
        } else {
          await upsertChatbotSession({
            userId,
            scope,
            courseId: course.id,
            sessionId: sid,
          });
        }
      }

      if (cancelled) return;
      setSessionId(sid);

      if (userId) {
        const history = await fetchChatbotHistory({
          userId,
          scope,
          courseId: course.id,
        });
        if (cancelled) return;
        if (history.length > 0) {
          setMessages(
            history.map((row) => ({
              id: row.id,
              role: row.role === "user" ? "user" : "ai",
              text: row.content,
            })),
          );
        } else {
          setMessages([
            {
              id: "welcome",
              role: "ai",
              text: welcomeText(scope, course.title),
            },
          ]);
        }
      } else {
        setMessages([
          {
            id: "welcome",
            role: "ai",
            text: welcomeText(scope, course.title),
          },
        ]);
      }

      if (!cancelled) setHistoryReady(true);
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [scope, userId, course.id, course.title]);

  useEffect(() => {
    if (!historyReady) return;
    endRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [messages.length, sending, historyReady]);

  useEffect(() => {
    return () => {
      if (mediaPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  const clearMedia = () => {
    if (mediaPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onPickMedia = (file: File | null) => {
    if (!file) {
      clearMedia();
      return;
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return;
    }
    if (mediaPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const send = async () => {
    const text = draft.trim();
    if ((!text && !mediaFile) || sending || !historyReady) return;

    let mediaUrl: string | null = null;
    let mediaType: "image" | "video" | null = null;

    if (mediaFile) {
      setSending(true);
      const up = await uploadAssistantMedia(mediaFile);
      if (!up.ok) {
        setSending(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "ai",
            text: "مقدرناش نرفع الملف. جرّب تاني.",
          },
        ]);
        return;
      }
      mediaUrl = up.publicUrl;
      mediaType = up.mediaType;
    }

    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: text || (mediaType === "video" ? "(فيديو)" : "(صورة)"),
      mediaUrl,
      mediaType,
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    clearMedia();
    setSending(true);

    if (userId) {
      void saveChatbotMessage({
        userId,
        scope,
        courseId: course.id,
        sessionId,
        role: "user",
        content: mediaUrl
          ? `${text}${text ? "\n" : ""}${mediaUrl}`
          : text,
      });
    }

    const result = await sendAssistantMessage({
      message: text,
      scope,
      userId: userId || "anon",
      courseId: course.id,
      courseName: course.title,
      sessionId,
      mediaUrl,
      mediaType,
    });

    const nextSid = result.sessionId || sessionId;
    if (nextSid && nextSid !== sessionId) {
      setSessionId(nextSid);
    }

    if (userId && nextSid) {
      void upsertChatbotSession({
        userId,
        scope,
        courseId: course.id,
        sessionId: nextSid,
      });
    }

    const aiText = result.ok
      ? result.message
      : result.message || "المساعد مش متاح دلوقتي.";

    const aiMsg: Msg = {
      id: `a-${Date.now()}`,
      role: "ai",
      text: aiText,
    };
    setMessages((prev) => [...prev, aiMsg]);

    if (userId && nextSid) {
      void saveChatbotMessage({
        userId,
        scope,
        courseId: course.id,
        sessionId: nextSid,
        role: "assistant",
        content: aiText,
      });
    }

    setSending(false);
  };

  const route = resolveAssistantRoute({
    courseId: course.id,
    courseName: course.title,
  });
  const workflowLabel = route.workflowName;
  const courseLabel = route.courseNameForPayload;
  const canSend = Boolean(draft.trim() || mediaFile);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505]">
      <header className="shrink-0 border-b border-white/10 bg-[#050505] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 text-right">
            <p className="text-xs font-medium tracking-wide text-yellow-400">
              مساعد التعلم
            </p>
            <h1 className="mt-1 font-display truncate text-lg font-bold text-white sm:text-xl">
              {course.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              محادثة محفوظة · {courseLabel} · {workflowLabel}
            </p>
          </div>
          {onBackToCommunity ? (
            <button
              type="button"
              onClick={onBackToCommunity}
              className="flex w-full items-center justify-center text-center rounded-full border border-yellow-400/50 bg-yellow-400 px-4 py-2 text-xs font-semibold text-[#050505] sm:w-auto sm:text-sm"
            >
              الرجوع للمجتمع
            </button>
          ) : null}
        </div>
      </header>

      <div className="premium-scroll min-h-0 flex-1 overflow-y-auto bg-[#050505]">
        {!historyReady ? (
          <p className="px-4 py-8 text-sm text-slate-500 sm:px-6">
            بنحمّل محادثتك السابقة…
          </p>
        ) : (
          <div className="space-y-3 px-3 py-4 sm:px-6 sm:py-5">
            {messages.map((msg) => {
              const mine = msg.role === "user";
              const showText =
                msg.text &&
                msg.text !== "(صورة)" &&
                msg.text !== "(فيديو)";
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${mine ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 text-start text-sm leading-relaxed ${
                      mine
                        ? "bg-yellow-400 text-[#050505]"
                        : "border border-white/10 bg-white/5 text-slate-200"
                    }`}
                  >
                    {!mine ? (
                      <p className="mb-1 text-[0.65rem] font-medium text-yellow-400">
                        المساعد
                      </p>
                    ) : null}
                    {msg.mediaUrl ? (
                      <div className="mb-2 overflow-hidden rounded-xl border border-black/10">
                        {msg.mediaType === "video" ? (
                          <video
                            src={msg.mediaUrl}
                            controls
                            className="max-h-56 w-full bg-black object-contain"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={msg.mediaUrl}
                            alt=""
                            className="max-h-56 w-full object-cover"
                          />
                        )}
                      </div>
                    ) : null}
                    {showText ? msg.text : null}
                  </div>
                </div>
              );
            })}
            {sending ? (
              <p className="px-1 text-xs text-slate-500">المساعد بيكتب…</p>
            ) : null}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form
        className="shrink-0 border-t border-white/10 bg-[#050505] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        {mediaPreview && mediaFile ? (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-2">
            {mediaFile.type.startsWith("video/") ? (
              <video
                src={mediaPreview}
                className="h-14 w-20 rounded-lg object-cover"
                muted
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaPreview}
                alt=""
                className="h-14 w-20 rounded-lg object-cover"
              />
            )}
            <p className="min-w-0 flex-1 truncate text-xs text-slate-400">
              {mediaFile.name}
            </p>
            <button
              type="button"
              onClick={clearMedia}
              className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
            >
              إزالة
            </button>
          </div>
        ) : null}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3 focus-within:border-yellow-400/40">
          <label className="sr-only" htmlFor="ai-learn-input">
            رسالتك للمساعد
          </label>
          <textarea
            id="ai-learn-input"
            rows={2}
            value={draft}
            disabled={sending || !historyReady}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="اسأل عن درس، مفهوم، أو تمرين… أو ارفع صورة/فيديو"
            className="w-full resize-none bg-transparent text-start text-sm leading-relaxed text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label
                className={`inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 text-slate-300 transition hover:border-yellow-400/40 hover:text-yellow-400 ${
                  sending || !historyReady
                    ? "pointer-events-none opacity-40"
                    : ""
                }`}
                title="ارفع صورة أو فيديو"
                aria-label="ارفع صورة أو فيديو"
              >
                📎
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  disabled={sending || !historyReady}
                  onChange={(e) =>
                    onPickMedia(e.target.files?.[0] ?? null)
                  }
                />
              </label>
              <p className="text-[0.65rem] text-slate-600 sm:text-[0.7rem]">
                Enter للإرسال
              </p>
            </div>
            <button
              type="submit"
              disabled={!canSend || sending || !historyReady}
              className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-medium text-[#050505] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {sending ? "…" : "إرسال"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
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
  N8N_WORKFLOW_NAMES,
  SMART_START_COURSE,
  isSmartStartCourse,
} from "@/lib/n8n-assistant";
import { RtlScroll, type RtlScrollHandle } from "@/components/ui/RtlScroll";

const ease = [0.22, 1, 0.36, 1] as const;

type Msg = {
  id: string;
  role: "ai" | "user";
  text: string;
};

const list = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease },
  },
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
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<RtlScrollHandle>(null);

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
    const id = window.setTimeout(() => {
      scrollRef.current?.scrollToBottom(
        messages.length <= 2 ? "auto" : "smooth",
      );
    }, 40);
    return () => window.clearTimeout(id);
  }, [messages.length, sending, historyReady]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending || !historyReady) return;

    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setSending(true);

    if (userId) {
      void saveChatbotMessage({
        userId,
        scope,
        courseId: course.id,
        sessionId,
        role: "user",
        content: text,
      });
    }

    const result = await sendAssistantMessage({
      message: text,
      scope,
      userId: userId || "anon",
      courseId: course.id,
      courseName: course.title,
      sessionId,
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

  const isSmartStart = isSmartStartCourse({
    courseId: course.id,
    courseName: course.title,
  });
  const workflowLabel =
    scope === "community"
      ? N8N_WORKFLOW_NAMES.community
      : N8N_WORKFLOW_NAMES.learningSmartStart;
  const courseLabel =
    scope === "learning" && isSmartStart
      ? SMART_START_COURSE.name
      : course.title;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <header className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
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
              className="shrink-0 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1.5 text-xs font-medium text-yellow-400 transition hover:bg-yellow-400 hover:text-[#050505] sm:text-sm"
            >
              الرجوع للمجتمع
            </button>
          ) : null}
        </div>
      </header>

      <RtlScroll ref={scrollRef} className="min-h-0 flex-1">
        {!historyReady ? (
          <p className="px-4 py-8 text-sm text-slate-500 sm:px-6">
            بنحمّل محادثتك السابقة…
          </p>
        ) : (
          <motion.div
            variants={list}
            initial="hidden"
            animate="show"
            className="space-y-3 px-3 py-4 sm:px-6 sm:py-5"
          >
            {messages.map((msg) => {
              const mine = msg.role === "user";
              return (
                <motion.div
                  key={msg.id}
                  variants={item}
                  className={`flex w-full ${mine ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 text-start text-sm leading-relaxed ${
                      mine
                        ? "bg-yellow-400 text-[#050505] shadow-[0_0_24px_rgba(251,191,36,0.2)]"
                        : "border border-white/10 bg-white/5 text-slate-200"
                    }`}
                  >
                    {!mine ? (
                      <p className="mb-1 text-[0.65rem] font-medium text-yellow-400">
                        المساعد
                      </p>
                    ) : null}
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
            {sending ? (
              <p className="px-1 text-xs text-slate-500">المساعد بيكتب…</p>
            ) : null}
            <div ref={endRef} />
          </motion.div>
        )}
      </RtlScroll>

      <form
        className="shrink-0 border-t border-white/10 p-3 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-md focus-within:border-yellow-400/40">
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
            placeholder="اسأل عن درس، مفهوم، أو تمرين…"
            className="w-full resize-none bg-transparent text-start text-sm leading-relaxed text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[0.65rem] text-slate-600 sm:text-[0.7rem]">
              Enter للإرسال
            </p>
            <button
              type="submit"
              disabled={!draft.trim() || sending || !historyReady}
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

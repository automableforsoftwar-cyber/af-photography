"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { CourseModule } from "@/lib/content";
import { useAuthStore } from "@/lib/auth-store";
import {
  getOrCreateAssistantSessionId,
  sendAssistantMessage,
  type AssistantContext,
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

type AiLearningChatProps = {
  course: CourseModule;
  /** community = assistant opened from Community; learning = Start Learning */
  scope?: AssistantContext;
  onBackToCommunity?: () => void;
};

export function AiLearningChat({
  course,
  scope = "learning",
  onBackToCommunity,
}: AiLearningChatProps) {
  const userId = useAuthStore((s) => s.userId) ?? "anon";
  const [sessionId, setSessionId] = useState(() =>
    getOrCreateAssistantSessionId({
      scope,
      userId,
      courseId: course.id,
    }),
  );
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "ai",
      text:
        scope === "community"
          ? `أهلاً بيك في مساعد المجتمع لمسار «${course.title}». اسأل عن الدروس، التصوير، أو أي فكرة — وهرد عليك فوراً.`
          : `أهلاً بيك في مسار «${course.title}». هنا بتتعلّم بالمحادثة — اسألني عن أي مفهوم، تمرين، أو فكرة، وهجاوبك باللهجة المصرية وبخطوات واضحة.`,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<RtlScrollHandle>(null);

  useEffect(() => {
    const sid = getOrCreateAssistantSessionId({
      scope,
      userId,
      courseId: course.id,
    });
    setSessionId(sid);
  }, [scope, userId, course.id]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      scrollRef.current?.scrollToBottom(
        messages.length <= 2 ? "auto" : "smooth",
      );
    }, 40);
    return () => window.clearTimeout(id);
  }, [messages.length, sending]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setSending(true);

    const result = await sendAssistantMessage({
      message: text,
      scope,
      userId,
      courseId: course.id,
      sessionId,
    });

    if (result.sessionId) {
      setSessionId(result.sessionId);
    }

    const aiMsg: Msg = {
      id: `a-${Date.now()}`,
      role: "ai",
      text: result.ok
        ? result.message
        : result.message || "المساعد مش متاح دلوقتي.",
    };
    setMessages((prev) => [...prev, aiMsg]);
    setSending(false);
  };

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
              محادثة ذكية مع ذاكرة جلسة محفوظة
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
            disabled={sending}
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
              disabled={!draft.trim() || sending}
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

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { CourseModule } from "@/lib/content";
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

function replyTo(text: string, courseTitle: string) {
  const t = text.trim();
  if (/ضوء|إضاءة|نور/.test(t)) {
    return "شوف اتجاه الضوء قبل الزرار. قرّب من مصدر واضح (شباك أو لمبة هادية) وحرّك نفسك شوية — غالبًا ده بيفرّق أكتر من أي عدة.";
  }
  if (/تكوين|فريم|قص/.test(t)) {
    return "حط المهم في مكان واضح، وسيب هوا حواليه. لو العين ضاعت في الزحمة — قرّب أو شيل عنصر من الإطار.";
  }
  if (/قرار|مشكلة|بدائل/.test(t)) {
    return "اكتب المشكلة في جملة، حط بديلين، اختار معيار نجاح، وبعدين قرّر. التخمين السريع غالي على المدى الطويل.";
  }
  if (/قصة|حكاية|تأثير/.test(t)) {
    return "اسأل نفسك: الصورة بتحكي إيه في جملة؟ لو مفيش جملة — ناقص سياق أو لحظة. خليك بسيط وواضح.";
  }
  return `سؤال كويس عن «${courseTitle}». ركّز على الفكرة مش الحفظ: افهم، طبّق على موقفك، وبعدين قِس النتيجة. لو حابب تفاصيل أكتر، اذكر الموضوع بالاسم (ضوء، تكوين، قرار…).`;
}

type AiLearningChatProps = {
  course: CourseModule;
};

export function AiLearningChat({ course }: AiLearningChatProps) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "ai",
      text: `أهلاً بيك في مسار «${course.title}». هنا بتتعلّم بالمحادثة — اسألني عن أي مفهوم، تمرين، أو فكرة، وهجاوبك باللهجة المصرية وبخطوات واضحة.`,
    },
  ]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<RtlScrollHandle>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      scrollRef.current?.scrollToBottom(
        messages.length <= 2 ? "auto" : "smooth",
      );
    }, 40);
    return () => window.clearTimeout(id);
  }, [messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    const aiMsg: Msg = {
      id: `a-${Date.now()}`,
      role: "ai",
      text: replyTo(text, course.title),
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setDraft("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <header className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-6">
        <p className="text-xs font-medium tracking-wide text-yellow-400">
          مساعد التعلم
        </p>
        <h1 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
          {course.title}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          اتعلّم بالمحادثة — مفيش فيديو ثابت، السؤال هو الدرس.
        </p>
      </header>

      <RtlScroll ref={scrollRef} className="min-h-0 flex-1">
        <motion.div
          variants={list}
          initial="hidden"
          animate="show"
          className="space-y-3 px-4 py-5 sm:px-6"
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
          <div ref={endRef} />
        </motion.div>
      </RtlScroll>

      <form
        className="shrink-0 border-t border-white/10 p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          send();
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
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="اسأل عن درس، مفهوم، أو تمرين…"
            className="w-full resize-none bg-transparent text-start text-sm leading-relaxed text-white outline-none placeholder:text-slate-500"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[0.7rem] text-slate-500">Enter للإرسال · Shift+Enter سطر جديد</p>
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-medium text-[#050505] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              إرسال
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

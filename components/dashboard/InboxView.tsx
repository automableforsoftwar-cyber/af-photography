"use client";

import { motion } from "framer-motion";
import { inboxThreads } from "@/lib/lms";
import { RtlScroll } from "@/components/ui/RtlScroll";

const ease = [0.22, 1, 0.36, 1] as const;

const list = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, x: 12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease },
  },
};

export function InboxView() {
  const thread = inboxThreads[0];
  if (!thread) return null;

  const messages = thread.messages.filter((m) => m.from === "them");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/15 text-sm font-bold text-yellow-400">
          {thread.initials}
        </span>
        <div className="min-w-0 text-start">
          <h2 className="font-display text-lg font-bold text-white">
            {thread.name}
          </h2>
          <p className="text-xs font-medium text-yellow-400">{thread.role}</p>
        </div>
      </header>

      <RtlScroll className="min-h-0 flex-1">
        <motion.div
          variants={list}
          initial="hidden"
          animate="show"
          className="space-y-3 px-4 py-5 sm:px-6"
        >
          <p className="mb-2 text-center text-xs text-slate-500">
            بث للقراءة فقط — مفيش رد من هنا
          </p>
          {messages.map((message) => (
            <motion.article
              key={message.id}
              variants={item}
              className="ms-auto max-w-[min(100%,28rem)] rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-start shadow-[0_0_24px_rgba(251,191,36,0.08)]"
            >
              <p className="text-[0.65rem] font-medium text-yellow-400">
                أمجد فريد · {message.time}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-100">
                {message.text}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </RtlScroll>
    </div>
  );
}

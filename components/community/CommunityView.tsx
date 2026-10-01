"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AmgadInbox } from "@/components/community/AmgadInbox";
import { RtlScroll } from "@/components/ui/RtlScroll";
import {
  channels,
  fetchCourseMessages,
  formatMessageTime,
  sendCourseMessage,
  type CourseChatMessage,
} from "@/lib/course-community";
import { uploadCommunityImage } from "@/lib/storage";
import { useAuthStore } from "@/lib/auth-store";

const ease = [0.22, 1, 0.36, 1] as const;

const list = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease },
  },
};

function channelLabel(name: string) {
  return `#${name}`;
}

type TabId = "general" | "photos" | "amgad";

type CommunityViewProps = {
  courseId: string;
};

export function CommunityView({ courseId }: CommunityViewProps) {
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const [tab, setTab] = useState<TabId>("general");
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<CourseChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const channelId = tab === "photos" ? "photos" : "general";
  const activeChannel =
    channels.find((c) => c.id === channelId) ?? channels[0];
  const isPhotos = tab === "photos";

  const load = useCallback(async () => {
    if (!courseId || tab === "amgad") return;
    setLoading(true);
    const data = await fetchCourseMessages({
      courseId,
      channelId,
    });
    setMessages(data);
    setLoading(false);
  }, [courseId, channelId, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if ((!draft.trim() && !file) || sending || !courseId) return;
    setSending(true);
    setNotice(null);

    let imageUrl: string | null = null;
    if (file) {
      const up = await uploadCommunityImage(file);
      if (!up.ok) {
        setSending(false);
        setNotice("مقدرناش نرفع الصورة من الجهاز.");
        return;
      }
      imageUrl = up.publicUrl;
    }

    const result = await sendCourseMessage({
      courseId,
      channelId,
      body: draft.trim() || "صورة",
      authorLabel: email.split("@")[0] || "عضو",
      imageUrl: isPhotos || imageUrl ? imageUrl : null,
    });
    setSending(false);
    if (!result.ok) {
      setNotice("مقدرناش نبعت الرسالة. تأكد إن اشتراك الكورس لسه شغال.");
      return;
    }
    setDraft("");
    setFile(null);
    setMessages((prev) => [...prev, result.message]);
  };

  if (!courseId) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        اختار كورس مفعّل عشان تدخل مجتمع المسار.
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "general", label: "#عام" },
    { id: "photos", label: "#الصور" },
    { id: "amgad", label: "إنبوكس أمجد فريد" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/40 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-white/10 lg:w-56 lg:border-b-0 lg:border-e">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-sm font-medium text-white">مجتمع الكورس</p>
          <p className="mt-0.5 text-xs text-slate-500">
            معزول · محفوظ · إنبوكس أمجد
          </p>
        </div>
        <ul className="space-y-1 p-3">
          {tabs.map((t) => {
            const active = t.id === tab;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-start text-sm transition-colors ${
                    active
                      ? "bg-yellow-400/15 font-medium text-yellow-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {tab === "amgad" ? (
          <AmgadInbox courseId={courseId} />
        ) : (
          <>
            <header className="shrink-0 border-b border-white/10 px-5 py-4">
              <h1 className="font-display text-base font-bold text-white">
                {channelLabel(activeChannel?.name ?? "")}
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                {activeChannel?.topic}
              </p>
            </header>

            <RtlScroll className="min-h-0 flex-1">
              {loading ? (
                <p className="px-5 py-8 text-sm text-slate-500">بنحمّل الرسائل…</p>
              ) : messages.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-500">
                  لسه مفيش رسائل — ابدأ النقاش أو ارفع صورة من جهازك.
                </p>
              ) : (
                <motion.div
                  key={`${courseId}-${channelId}`}
                  variants={list}
                  initial="hidden"
                  animate="show"
                  className="space-y-1 px-2 py-3"
                >
                  <AnimatePresence mode="popLayout">
                    {messages.map((message) => {
                      const mine = message.user_id === userId;
                      const label =
                        message.author_label || (mine ? "إنت" : "عضو");
                      return (
                        <motion.article
                          key={message.id}
                          variants={item}
                          layout
                          className={`flex gap-3 rounded-xl px-4 py-3 ${
                            mine ? "bg-yellow-400/5" : "hover:bg-white/5"
                          }`}
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[0.65rem] font-medium text-yellow-400">
                            {label.slice(0, 2)}
                          </span>
                          <div className="min-w-0 flex-1 text-start">
                            <p className="text-sm">
                              <span className="font-medium text-white">
                                {label}
                              </span>
                              <span className="ms-2 text-xs text-slate-500">
                                {formatMessageTime(message.created_at)}
                              </span>
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                              {message.body}
                            </p>
                            {message.image_url ? (
                              <div className="relative mt-3 aspect-[4/3] max-w-sm overflow-hidden rounded-xl border border-white/10">
                                <Image
                                  src={message.image_url}
                                  alt=""
                                  fill
                                  sizes="320px"
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : null}
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </RtlScroll>

            <form
              className="shrink-0 border-t border-white/10 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              {notice ? (
                <p className="mb-2 text-xs text-yellow-400/90">{notice}</p>
              ) : null}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md focus-within:border-yellow-400/35">
                <textarea
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  placeholder={
                    isPhotos
                      ? "وصف الفريم أو تعليق…"
                      : `رسالة إلى ${channelLabel(activeChannel?.name ?? "")}`
                  }
                  className="w-full resize-none bg-transparent text-start text-sm leading-relaxed text-white outline-none placeholder:text-slate-500"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-yellow-400/40 hover:text-yellow-400">
                    {file ? file.name : "ارفع من جهازك"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={sending || (!draft.trim() && !file)}
                    className="ms-auto rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-medium text-[#050505] disabled:opacity-35"
                  >
                    {sending ? "…" : "ابعت"}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

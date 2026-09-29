"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useMemo, useRef } from "react";
import { RtlScroll } from "@/components/ui/RtlScroll";
import {
  channels,
  getAuthor,
  getSeedMessages,
} from "@/lib/community";
import { useWorkspaceStore } from "@/lib/workspace-store";

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

function PersonAvatar({ id }: { id: string }) {
  const author = getAuthor(id);
  if (author.avatar) {
    return (
      <span className="relative size-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
        <Image
          src={author.avatar}
          alt=""
          fill
          sizes="36px"
          className="object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-medium text-white ${author.color}`}
    >
      {author.initials}
    </span>
  );
}

export function CommunityView() {
  const activeId = useWorkspaceStore((state) => state.communityActiveId);
  const draft = useWorkspaceStore((state) => state.communityDraft);
  const sent = useWorkspaceStore((state) => state.communitySent);
  const setActiveId = useWorkspaceStore((state) => state.setCommunityActiveId);
  const setDraft = useWorkspaceStore((state) => state.setCommunityDraft);
  const sendCommunity = useWorkspaceStore((state) => state.sendCommunity);
  const fileRef = useRef<HTMLInputElement>(null);

  const safeActive =
    channels.some((c) => c.id === activeId) ? activeId : channels[0]?.id ?? "general";
  const activeChannel =
    channels.find((channel) => channel.id === safeActive) ?? channels[0];
  const isPhotos = activeChannel?.id === "photos";

  const messages = useMemo(() => {
    const seeded = getSeedMessages(safeActive);
    const extra = sent[safeActive] ?? [];
    return [...seeded, ...extra];
  }, [safeActive, sent]);

  const send = () => sendCommunity(safeActive, draft);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/40 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-white/10 lg:w-56 lg:border-b-0 lg:border-e">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-sm font-medium text-white">المجتمع</p>
          <p className="mt-0.5 text-xs text-slate-500">قناتان داخل الكورس</p>
        </div>
        <ul className="space-y-1 p-3">
          {channels.map((channel) => {
            const active = channel.id === safeActive;
            return (
              <li key={channel.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(channel.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-start text-sm transition-colors ${
                    active
                      ? "bg-yellow-400/15 font-medium text-yellow-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  {channelLabel(channel.name)}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-white/10 px-5 py-4">
          <h1 className="font-display text-base font-bold text-white">
            {channelLabel(activeChannel?.name ?? "")}
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">{activeChannel?.topic}</p>
        </header>

        <RtlScroll className="min-h-0 flex-1">
          <motion.div
            key={safeActive}
            variants={list}
            initial="hidden"
            animate="show"
            className="space-y-1 px-2 py-3"
          >
            <AnimatePresence mode="popLayout">
              {messages.map((message) => {
                const author = getAuthor(message.authorId);
                const mine = message.authorId === "you";
                return (
                  <motion.article
                    key={message.id}
                    variants={item}
                    layout
                    className={`flex gap-3 rounded-xl px-4 py-3 ${
                      mine ? "bg-yellow-400/5" : "hover:bg-white/5"
                    }`}
                  >
                    <PersonAvatar id={author.id} />
                    <div className="min-w-0 flex-1 text-start">
                      <p className="text-sm">
                        <span className="font-medium text-white">
                          {author.name}
                        </span>
                        <span className="ms-2 text-xs text-slate-500">
                          {message.time}
                        </span>
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                        {message.text}
                      </p>
                      {message.image ? (
                        <div className="relative mt-3 aspect-[4/3] max-w-sm overflow-hidden rounded-xl border border-white/10">
                          <Image
                            src={message.image}
                            alt=""
                            fill
                            sizes="320px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </RtlScroll>

        <form
          className="shrink-0 border-t border-white/10 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md focus-within:border-yellow-400/35">
            <textarea
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={
                isPhotos
                  ? "اكتب وصف للفريم أو تعليق…"
                  : `رسالة إلى ${channelLabel(activeChannel?.name ?? "")}`
              }
              className="w-full resize-none bg-transparent text-start text-sm leading-relaxed text-white outline-none placeholder:text-slate-500"
            />
            <div className="mt-2 flex items-center gap-2">
              {isPhotos ? (
                <>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-yellow-400/40 hover:text-yellow-400"
                  >
                    ارفع صورة
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={() => {
                      /* UI-only picker; caption sends as text */
                    }}
                  />
                </>
              ) : null}
              <button
                type="submit"
                disabled={!draft.trim()}
                className="ms-auto rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-medium text-[#050505] disabled:opacity-35"
              >
                ابعت
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RtlScroll } from "@/components/ui/RtlScroll";
import {
  fetchPeerDisplayName,
  fetchPeerThread,
  sendPeerMessage,
  type PeerDirectMessage,
} from "@/lib/direct-messages";
import { useAuthStore } from "@/lib/auth-store";

type PeerDMChatProps = {
  peerUserId: string;
  peerNameHint?: string | null;
};

export function PeerDMChat({ peerUserId, peerNameHint }: PeerDMChatProps) {
  const myId = useAuthStore((s) => s.userId);
  const [peerName, setPeerName] = useState(peerNameHint?.trim() || "عضو");
  const [messages, setMessages] = useState<PeerDirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isSelf = Boolean(myId && myId === peerUserId);

  const load = useCallback(async () => {
    if (isSelf) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [thread, name] = await Promise.all([
      fetchPeerThread(peerUserId),
      fetchPeerDisplayName(peerUserId),
    ]);
    setMessages(thread);
    if (name && name !== "عضو") setPeerName(name);
    else if (peerNameHint?.trim()) setPeerName(peerNameHint.trim());
    setLoading(false);
  }, [peerUserId, peerNameHint, isSelf]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (!draft.trim() || sending || isSelf) return;
    setSending(true);
    setNotice(null);
    const result = await sendPeerMessage({
      receiverId: peerUserId,
      content: draft,
    });
    setSending(false);
    if (!result.ok) {
      setNotice("مقدرناش نبعت الرسالة. حاول تاني.");
      return;
    }
    setDraft("");
    setMessages((prev) => [...prev, result.message]);
  };

  if (isSelf) {
    return (
      <div
        dir="rtl"
        className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-slate-500"
      >
        <p>مينفعش تبعت رسالة لنفسك.</p>
        <Link
          href="/dashboard/community"
          className="text-yellow-400 hover:underline"
        >
          رجوع للمجتمع
        </Link>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/40 text-right shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="min-w-0 text-right">
          <p className="text-xs text-slate-500">رسالة خاصة</p>
          <h1 className="font-display truncate text-lg font-bold text-white">
            {peerName}
          </h1>
        </div>
        <Link
          href="/dashboard/community"
          className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-yellow-400/40 hover:text-yellow-400"
        >
          المجتمع
        </Link>
      </header>

      <RtlScroll className="min-h-0 flex-1 px-4 py-4">
        {loading ? (
          <p className="text-right text-sm text-slate-500">بنحمّل المحادثة…</p>
        ) : messages.length === 0 ? (
          <p className="text-right text-sm text-slate-500">
            لسه مفيش رسائل مع {peerName} — ابدأ المحادثة.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => {
              const mine = m.sender_id === myId;
              return (
                <li
                  key={m.id}
                  className={`flex w-full ${mine ? "justify-start" : "justify-end"}`}
                >
                  <article
                    className={`max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-right ${
                      mine
                        ? "border border-yellow-400/25 bg-yellow-400/10"
                        : "border border-white/10 bg-white/5"
                    }`}
                  >
                    <p className="text-[0.65rem] text-slate-500">
                      {new Date(m.created_at).toLocaleString("ar-EG")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-100">
                      {m.content}
                    </p>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </RtlScroll>

      <form
        dir="rtl"
        className="shrink-0 border-t border-white/10 p-4 text-right"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        {notice ? (
          <p className="mb-2 text-right text-xs text-yellow-400/90">{notice}</p>
        ) : null}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 focus-within:border-yellow-400/35">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={`رسالة إلى ${peerName}…`}
            className="w-full resize-none bg-transparent text-right text-sm leading-relaxed text-white outline-none placeholder:text-slate-500"
          />
          <div className="mt-2 flex justify-start">
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-medium text-[#050505] disabled:opacity-35"
            >
              {sending ? "…" : "ابعت"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

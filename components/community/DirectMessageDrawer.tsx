"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/lib/auth-store";
import { useLiveStaffRole } from "@/lib/use-live-staff";
import {
  fetchPeerDisplayName,
  fetchPeerThread,
  markPeerThreadRead,
  sendPeerMessage,
  type PeerDirectMessage,
} from "@/lib/direct-messages";
import { fetchProfilesByIds, setUserBlocked } from "@/lib/moderation";
import { uploadCommunityImage } from "@/lib/storage";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { RtlScroll } from "@/components/ui/RtlScroll";
import { RoleBadge } from "@/components/community/RoleBadge";

export type ActiveChatUser = {
  userId: string;
  name: string;
};

type DirectMessageDrawerProps = {
  user: ActiveChatUser;
  onClose: () => void;
  incomingMessage?: PeerDirectMessage | null;
  onOpenedPeer?: (peerUserId: string) => void;
};

/**
 * True fixed slide-over overlay (viewport-level via portal).
 * Opened ONLY by React state — never by URL / query params.
 */
export function DirectMessageDrawer({
  user,
  onClose,
  incomingMessage,
  onOpenedPeer,
}: DirectMessageDrawerProps) {
  const myId = useAuthStore((s) => s.userId);
  const isBlocked = useAuthStore((s) => s.isBlocked);
  const { isStaff, isChatBlocked } = useLiveStaffRole();
  const canModerate = isStaff;
  const chatMuted = isBlocked || isChatBlocked;
  const peerUserId = user.userId;
  const [peerName, setPeerName] = useState(user.name?.trim() || "عضو");
  const [peerTitle, setPeerTitle] = useState<string | null>(null);
  const [messages, setMessages] = useState<PeerDirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastIncomingId = useRef<string | null>(null);
  const loadedPeerRef = useRef<string | null>(null);
  const onOpenedPeerRef = useRef(onOpenedPeer);
  const onCloseRef = useRef(onClose);
  const fileInputRef = useRef<HTMLInputElement>(null);

  onOpenedPeerRef.current = onOpenedPeer;
  onCloseRef.current = onClose;

  const isSelf = Boolean(myId && peerUserId === myId);
  const canSend = Boolean((draft.trim() || file) && !chatMuted);
  const initials = peerName.slice(0, 2) || "؟";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch history once per peer open — never tied to parent re-renders.
  useEffect(() => {
    if (!peerUserId) return;
    if (myId && peerUserId === myId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    if (loadedPeerRef.current === peerUserId) return;

    let cancelled = false;
    loadedPeerRef.current = peerUserId;
    setLoading(true);
    setNotice(null);
    setDraft("");
    setFile(null);

    void (async () => {
      try {
        await markPeerThreadRead(peerUserId);
        if (!cancelled) onOpenedPeerRef.current?.(peerUserId);
        const [thread, name, meta] = await Promise.all([
          fetchPeerThread(peerUserId),
          fetchPeerDisplayName(peerUserId),
          fetchProfilesByIds([peerUserId]),
        ]);
        if (cancelled) return;
        setMessages(thread);
        if (name && name !== "عضو") setPeerName(name);
        else if (user.name?.trim()) setPeerName(user.name.trim());
        setPeerTitle(meta.get(peerUserId)?.title ?? null);
      } catch (error) {
        console.error("DM drawer load:", error);
        if (!cancelled) {
          loadedPeerRef.current = null;
          setNotice("مقدرناش نحمّل المحادثة.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [peerUserId, myId, user.name]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime append only
  useEffect(() => {
    if (!incomingMessage) return;
    if (incomingMessage.id === lastIncomingId.current) return;
    if (incomingMessage.sender_id !== peerUserId) return;
    lastIncomingId.current = incomingMessage.id;
    setMessages((prev) => {
      if (prev.some((m) => m.id === incomingMessage.id)) return prev;
      return [
        ...prev,
        {
          ...incomingMessage,
          image_url: incomingMessage.image_url ?? null,
          is_read: true,
        },
      ];
    });
    void markPeerThreadRead(peerUserId).then(() => {
      onOpenedPeerRef.current?.(peerUserId);
    });
  }, [incomingMessage, peerUserId]);

  const send = async () => {
    if (!peerUserId || sending || isSelf) return;
    if (chatMuted) {
      setNotice("تم إيقاف حسابك من إرسال الرسائل");
      return;
    }
    if (!draft.trim() && !file) return;

    setSending(true);
    setNotice(null);

    let imageUrl: string | null = null;
    if (file) {
      const up = await uploadCommunityImage(file);
      if (!up.ok) {
        setSending(false);
        setNotice("مقدرناش نرفع الصورة. جرّب تاني.");
        return;
      }
      imageUrl = up.publicUrl;
    }

    const result = await sendPeerMessage({
      receiverId: peerUserId,
      content: draft,
      imageUrl,
    });
    setSending(false);
    if (!result.ok) {
      setNotice(
        result.message === "blocked" || result.message === "chat_blocked"
          ? "تم إيقاف حسابك من إرسال الرسائل"
          : "مقدرناش نبعت الرسالة. حاول تاني.",
      );
      return;
    }
    setDraft("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessages((prev) => {
      if (prev.some((m) => m.id === result.message.id)) return prev;
      return [...prev, result.message];
    });
  };

  const blockPeer = async () => {
    if (!canModerate || !peerUserId || peerUserId === myId) return;
    const result = await setUserBlocked(peerUserId, true);
    if (!result.ok) {
      setNotice("مقدرناش نحظر المستخدم.");
      return;
    }
    setNotice("تم حظر المستخدم.");
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop — click to close */}
      <button
        type="button"
        aria-label="قفل المحادثة"
        className="fixed inset-0 z-[9998] bg-black/55 backdrop-blur-sm"
        onClick={() => onCloseRef.current()}
      />

      <aside
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label={`محادثة مع ${peerName}`}
        className="fixed inset-y-0 right-0 z-[9999] flex w-96 max-w-[100vw] flex-col border-l border-gray-800 bg-[#0a0a0a] text-right shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 text-sm font-medium text-yellow-400">
              {initials}
            </span>
            <div className="min-w-0 text-right">
              <p className="text-[0.65rem] text-slate-500">رسالة خاصة</p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <h2 className="font-display truncate text-base font-bold text-white">
                  {peerName}
                </h2>
                <RoleBadge title={peerTitle} />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canModerate && !isSelf ? (
              <button
                type="button"
                onClick={() => void blockPeer()}
                className="rounded-full border border-red-400/30 px-2.5 py-1 text-[0.7rem] text-red-300 transition hover:bg-red-500/10"
              >
                حظر المستخدم
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onCloseRef.current()}
              className="flex size-9 items-center justify-center rounded-full border border-white/15 text-slate-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
              aria-label="قفل"
            >
              ✕
            </button>
          </div>
        </header>

        {isSelf ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
            مينفعش تبعت رسالة لنفسك.
          </div>
        ) : (
          <>
            <RtlScroll className="min-h-0 flex-1 px-4 py-4">
              {loading && messages.length === 0 ? (
                <p className="text-right text-sm text-slate-500">
                  بنحمّل المحادثة…
                </p>
              ) : messages.length === 0 ? (
                <p className="text-right text-sm text-slate-500">
                  لسه مفيش رسائل مع {peerName} — ابدأ المحادثة.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {messages.map((m) => {
                    const mine = m.sender_id === myId;
                    const showText = m.content && m.content !== "(صورة)";
                    return (
                      <li
                        key={m.id}
                        className={`flex w-full ${mine ? "justify-start" : "justify-end"}`}
                      >
                        <article
                          className={`max-w-[min(100%,18rem)] rounded-2xl px-4 py-3 text-right ${
                            mine
                              ? "border border-yellow-400/25 bg-yellow-400/10"
                              : "border border-white/10 bg-white/5"
                          }`}
                        >
                          <p className="text-[0.65rem] text-slate-500">
                            {new Date(m.created_at).toLocaleString("ar-EG")}
                          </p>
                          {showText ? (
                            <p className="mt-1 text-sm leading-relaxed text-slate-100">
                              {m.content}
                            </p>
                          ) : null}
                          {m.image_url ? (
                            <button
                              type="button"
                              onClick={() => setLightboxSrc(m.image_url)}
                              className="relative mt-2 block w-full max-w-[15rem] overflow-hidden rounded-xl border border-white/10 transition hover:border-yellow-400/40"
                            >
                              <span className="relative block aspect-[4/3] w-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={m.image_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </span>
                            </button>
                          ) : null}
                        </article>
                      </li>
                    );
                  })}
                  <div ref={messagesEndRef} />
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
                <p className="mb-2 text-right text-xs text-yellow-400/90">
                  {notice}
                </p>
              ) : null}
              {chatMuted ? (
                <p className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-300">
                  تم إيقاف حسابك من إرسال الرسائل
                </p>
              ) : null}
              {file ? (
                <p className="mb-2 truncate text-xs text-slate-400">
                  صورة جاهزة: {file.name}
                </p>
              ) : null}
              <div
                className={`rounded-2xl border bg-white/5 p-3 ${
                  chatMuted
                    ? "border-red-400/25 opacity-60"
                    : "border-white/10 focus-within:border-yellow-400/35"
                }`}
              >
                <textarea
                  rows={2}
                  value={draft}
                  disabled={chatMuted}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (chatMuted) return;
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder={
                    chatMuted
                      ? "تم إيقاف حسابك من إرسال الرسائل"
                      : `رسالة إلى ${peerName}…`
                  }
                  className="w-full resize-none bg-transparent text-right text-sm leading-relaxed text-white outline-none placeholder:text-red-300/80 disabled:cursor-not-allowed disabled:placeholder:text-red-300"
                />
                <div className="mt-2 flex flex-row-reverse flex-wrap items-center justify-between gap-2">
                  <button
                    type="submit"
                    disabled={sending || !canSend}
                    className="rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-medium text-[#050505] disabled:opacity-35"
                  >
                    {sending ? "…" : "ابعت"}
                  </button>
                  <label
                    className={`rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 ${
                      chatMuted
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer hover:border-yellow-400/40 hover:text-yellow-400"
                    }`}
                  >
                    {file ? "غيّر الصورة" : "ارفع صورة"}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={chatMuted}
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>
            </form>
          </>
        )}
      </aside>

      <ImageLightbox
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </>,
    document.body,
  );
}

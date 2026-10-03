"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EmojiClickData } from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import { AmgadInbox } from "@/components/community/AmgadInbox";
import {
  DirectMessageDrawer,
  type ActiveChatUser,
} from "@/components/community/DirectMessageDrawer";
import { MemberActionMenu } from "@/components/community/MemberActionMenu";
import { RoleBadge } from "@/components/community/RoleBadge";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { RtlScroll, type RtlScrollHandle } from "@/components/ui/RtlScroll";
import {
  QUICK_REACTIONS,
  channels,
  fetchCourseMessages,
  formatMessageTime,
  sendCourseMessage,
  subscribeCourseMessages,
  toggleMessageReaction,
  type CourseChatMessage,
} from "@/lib/course-community";
import {
  fetchPeerConversations,
  subscribeIncomingPeerMessages,
  type PeerConversation,
  type PeerDirectMessage,
} from "@/lib/direct-messages";
import {
  deleteCourseMessage,
  fetchProfilesByIds,
  setUserBlocked,
} from "@/lib/moderation";
import { uploadCommunityImage } from "@/lib/storage";
import { useAuthStore } from "@/lib/auth-store";
import { pickDisplayName } from "@/lib/display-name";
import { useLiveStaffRole } from "@/lib/use-live-staff";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <p className="p-3 text-xs text-slate-500">بنحمّل الإيموجي…</p>
  ),
});

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

type TabId = "general" | "photos" | "announcements" | "inbox";

type CommunityViewProps = {
  courseId: string;
};

export function CommunityView({ courseId }: CommunityViewProps) {
  const userId = useAuthStore((s) => s.userId);
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const isBlockedStore = useAuthStore((s) => s.isBlocked);
  const { isStaff, role: liveRole, isChatBlocked } = useLiveStaffRole();
  const canModerate = isStaff;
  const role = liveRole;
  const isBlocked = isBlockedStore;
  const chatMuted = isBlocked || isChatBlocked;
  const [tab, setTab] = useState<TabId>("general");
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<CourseChatMessage[]>([]);
  const [authorMeta, setAuthorMeta] = useState<
    Record<string, { title: string | null; is_blocked: boolean }>
  >({});
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<CourseChatMessage | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [reactPickerFor, setReactPickerFor] = useState<string | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<ActiveChatUser | null>(
    null,
  );
  const [conversations, setConversations] = useState<PeerConversation[]>([]);
  const [unreadSenders, setUnreadSenders] = useState<Set<string>>(new Set());
  const [liveIncoming, setLiveIncoming] = useState<PeerDirectMessage | null>(
    null,
  );
  const pickerRef = useRef<HTMLDivElement>(null);
  const reactPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<RtlScrollHandle>(null);
  const activeChatUserRef = useRef(activeChatUser);
  activeChatUserRef.current = activeChatUser;

  useEffect(() => {
    // Always land on the newest message (bottom) — scroll the chat scroller, not the window
    const id = window.setTimeout(() => {
      chatScrollRef.current?.scrollToBottom(
        messages.length <= 1 ? "auto" : "smooth",
      );
    }, 50);
    return () => window.clearTimeout(id);
  }, [messages, tab]);

  const authorName = pickDisplayName(fullName, email);
  const hasAnyUnread = unreadSenders.size > 0;

  // Strip legacy ?dm= / ?name= from the URL without using them (no router navigation).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("dm") && !url.searchParams.has("name")) return;
    url.searchParams.delete("dm");
    url.searchParams.delete("name");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setUnreadSenders(new Set());
      return;
    }
    const list = await fetchPeerConversations();
    setConversations(list);
    setUnreadSenders(
      new Set(list.filter((c) => c.unread).map((c) => c.peerUserId)),
    );
  }, [userId]);

  const openPeerDm = useCallback((peerUserId: string, name: string) => {
    if (!peerUserId) return;
    setLiveIncoming(null);
    setActiveChatUser((prev) => {
      if (prev?.userId === peerUserId && prev.name === name) return prev;
      return { userId: peerUserId, name };
    });
  }, []);

  const handleDmClose = useCallback(() => {
    setActiveChatUser(null);
    setLiveIncoming(null);
    void refreshConversations();
  }, [refreshConversations]);

  const handleOpenedPeer = useCallback((peerId: string) => {
    setUnreadSenders((prev) => {
      if (!prev.has(peerId)) return prev;
      const next = new Set(prev);
      next.delete(peerId);
      return next;
    });
    setConversations((prev) =>
      prev.map((c) =>
        c.peerUserId === peerId ? { ...c, unread: false } : c,
      ),
    );
  }, []);

  const channelId =
    tab === "photos"
      ? "photos"
      : tab === "announcements"
        ? "announcements"
        : "general";
  const activeChannel =
    channels.find((c) => c.id === channelId) ?? channels[0];
  const isPhotos = tab === "photos";
  const isAnnouncements = tab === "announcements";
  // Strict: students never get a composer on #الرسائل — only instructor/organizer
  const canBroadcastAnnouncements =
    role === "instructor" || role === "organizer";
  const announcementsReadOnly =
    isAnnouncements && !canBroadcastAnnouncements;

  const load = useCallback(async () => {
    if (!courseId || tab === "inbox") return;
    setLoading(true);
    const data = await fetchCourseMessages({
      courseId,
      channelId,
    });
    setMessages(data);
    const meta = await fetchProfilesByIds(data.map((m) => m.user_id));
    const next: Record<string, { title: string | null; is_blocked: boolean }> =
      {};
    meta.forEach((value, key) => {
      next[key] = { title: value.title, is_blocked: value.is_blocked };
    });
    setAuthorMeta(next);
    setLoading(false);
  }, [courseId, channelId, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime community channel messages (no refresh needed)
  useEffect(() => {
    if (!courseId || tab === "inbox") return;
    return subscribeCourseMessages({
      courseId,
      channelId,
      onInsert: (message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        void fetchProfilesByIds([message.user_id]).then((meta) => {
          const profile = meta.get(message.user_id);
          if (!profile) return;
          setAuthorMeta((prev) => ({
            ...prev,
            [message.user_id]: {
              title: profile.title,
              is_blocked: profile.is_blocked,
            },
          }));
        });
      },
      onUpdate: (message) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? {
                  ...m,
                  ...message,
                  reply_to: m.reply_to,
                  author_title: m.author_title ?? message.author_title,
                  author_role: m.author_role ?? message.author_role,
                }
              : m,
          ),
        );
      },
      onDelete: (messageId) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      },
    });
  }, [courseId, channelId, tab]);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!userId) return;
    return subscribeIncomingPeerMessages({
      userId,
      onInsert: (message) => {
        const openPeer = activeChatUserRef.current;
        if (openPeer && openPeer.userId === message.sender_id) {
          setLiveIncoming(message);
          setUnreadSenders((prev) => {
            if (!prev.has(message.sender_id)) return prev;
            const next = new Set(prev);
            next.delete(message.sender_id);
            return next;
          });
          setConversations((prev) => {
            const exists = prev.some((c) => c.peerUserId === message.sender_id);
            if (!exists) {
              void refreshConversations();
              return prev;
            }
            return prev.map((c) =>
              c.peerUserId === message.sender_id
                ? { ...c, unread: false, lastMessageAt: message.created_at }
                : c,
            );
          });
          return;
        }
        setUnreadSenders((prev) => {
          const next = new Set(prev);
          next.add(message.sender_id);
          return next;
        });
        setConversations((prev) => {
          const exists = prev.some((c) => c.peerUserId === message.sender_id);
          if (!exists) {
            void refreshConversations();
            return prev;
          }
          return prev.map((c) =>
            c.peerUserId === message.sender_id
              ? { ...c, unread: true, lastMessageAt: message.created_at }
              : c,
          );
        });
      },
    });
  }, [userId, refreshConversations]);

  useEffect(() => {
    setReplyTo(null);
    setPickerOpen(false);
    setReactPickerFor(null);
  }, [tab]);

  useEffect(() => {
    if (!pickerOpen && !reactPickerFor) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pickerOpen && pickerRef.current && !pickerRef.current.contains(target)) {
        setPickerOpen(false);
      }
      if (
        reactPickerFor &&
        reactPickerRef.current &&
        !reactPickerRef.current.contains(target)
      ) {
        setReactPickerFor(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pickerOpen, reactPickerFor]);

  const send = async () => {
    if (announcementsReadOnly) {
      setNotice("هذه القناة للقراءة فقط");
      return;
    }
    if (chatMuted) {
      setNotice("تم إيقاف حسابك من إرسال الرسائل");
      return;
    }
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
      body: draft.trim(),
      authorLabel: authorName,
      imageUrl,
      replyToId: replyTo?.id ?? null,
    });
    setSending(false);
    if (!result.ok) {
      setNotice(
        result.message === "blocked" || result.message === "chat_blocked"
          ? "تم إيقاف حسابك من إرسال الرسائل"
          : result.message === "read_only"
            ? "هذه القناة للقراءة فقط"
            : "مقدرناش نبعت الرسالة. تأكد إن اشتراك الكورس لسه شغال.",
      );
      return;
    }
    setDraft("");
    setFile(null);
    setReplyTo(null);
    setPickerOpen(false);
    setMessages((prev) => [...prev, result.message]);
  };

  const onDeleteMessage = async (messageId: string) => {
    if (!canModerate) return;
    const result = await deleteCourseMessage(messageId);
    if (!result.ok) {
      setNotice("مقدرناش نمسح الرسالة.");
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const onBlockUser = async (targetUserId: string) => {
    if (!canModerate || !targetUserId || targetUserId === userId) return;
    const result = await setUserBlocked(targetUserId, true);
    if (!result.ok) {
      setNotice("مقدرناش نحظر المستخدم.");
      return;
    }
    setAuthorMeta((prev) => ({
      ...prev,
      [targetUserId]: {
        title: prev[targetUserId]?.title ?? null,
        is_blocked: true,
      },
    }));
    setNotice("تم حظر المستخدم.");
    setMenuFor(null);
  };

  const onReact = async (messageId: string, emoji: string) => {
    const result = await toggleMessageReaction(messageId, emoji);
    if (!result.ok) {
      setNotice("مقدرناش نسجّل الريأكشن. حاول تاني.");
      return;
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, reactions: result.reactions } : m,
      ),
    );
    setReactPickerFor(null);
  };

  const onEmojiPick = (data: EmojiClickData) => {
    setDraft((prev) => prev + data.emoji);
    setPickerOpen(false);
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
    { id: "announcements", label: "#الرسائل" },
    { id: "photos", label: "#الصور" },
    {
      id: "inbox",
      label: isStaff ? "صندوق الوارد" : "أمجد فريد",
    },
  ];

  return (
    <div
      dir="rtl"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/40 text-right shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:flex-row"
    >
      <aside className="flex w-full shrink-0 flex-col border-b border-white/10 lg:w-60 lg:border-b-0 lg:border-s lg:overflow-y-auto">
        <div className="border-b border-white/10 px-4 py-4 text-right">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-white">المجتمع</p>
            <span
              className="relative inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-slate-300"
              title="الرسائل الخاصة"
              aria-label={
                hasAnyUnread ? "رسائل غير مقروءة" : "الرسائل الخاصة"
              }
            >
              ✉
              {hasAnyUnread ? (
                <span className="absolute -start-0.5 -top-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-[#050505]" />
              ) : null}
            </span>
          </div>
        </div>
        <ul className="space-y-1 p-3">
          {tabs.map((t) => {
            const active = t.id === tab;
            const isLockedChannel =
              t.id === "announcements" && !canBroadcastAnnouncements;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-right text-sm transition-colors ${
                    active
                      ? "bg-yellow-400/15 font-medium text-yellow-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <span>{t.label}</span>
                  {isLockedChannel ? (
                    <span className="shrink-0 rounded-full border border-white/10 px-1.5 py-0.5 text-[0.6rem] text-slate-500">
                      قراءة فقط
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto border-t border-white/10 p-3">
          <p className="mb-2 px-1 text-[0.7rem] font-medium tracking-wide text-slate-500">
            الرسائل الخاصة
          </p>
          {conversations.length === 0 ? (
            <p className="px-1 text-xs leading-relaxed text-slate-600">
              اضغط على اسم عضو في الشات عشان تبدأ محادثة خاصة.
            </p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto lg:max-h-64">
              {conversations.map((c) => {
                const active = activeChatUser?.userId === c.peerUserId;
                const unread = unreadSenders.has(c.peerUserId) || c.unread;
                return (
                  <li key={c.peerUserId}>
                    <button
                      type="button"
                      onClick={() => openPeerDm(c.peerUserId, c.peerName)}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-sm transition-colors ${
                        active
                          ? "bg-yellow-400/15 font-medium text-yellow-400"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[0.6rem] text-yellow-400">
                        {c.peerName.slice(0, 2)}
                        {unread ? (
                          <span className="absolute -start-0.5 -top-0.5 size-2 rounded-full bg-red-500 ring-2 ring-[#050505]" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.peerName}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {tab === "inbox" ? (
          <AmgadInbox courseId={courseId} />
        ) : (
          <>
            <header className="shrink-0 border-b border-white/10 px-5 py-4 text-right">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h1 className="font-display text-base font-bold text-white">
                    {channelLabel(activeChannel?.name ?? "")}
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {activeChannel?.topic}
                  </p>
                </div>
                {isAnnouncements ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.65rem] text-slate-400">
                    {announcementsReadOnly
                      ? "قراءة فقط · للإدارة"
                      : "إدارة · نشر للجميع"}
                  </span>
                ) : null}
              </div>
            </header>

            <RtlScroll ref={chatScrollRef} className="min-h-0 flex-1">
              {loading ? (
                <p className="px-5 py-8 text-right text-sm text-slate-500">
                  بنحمّل الرسائل…
                </p>
              ) : messages.length === 0 ? (
                <p className="px-5 py-8 text-right text-sm text-slate-500">
                  {isAnnouncements
                    ? "لسه مفيش إعلانات — الإدارة هتنشر هنا لما يبقى فيه تحديث."
                    : "لسه مفيش رسائل — ابدأ النقاش أو ارفع صورة من جهازك."}
                </p>
              ) : (
                <motion.div
                  key={`${courseId}-${channelId}`}
                  variants={list}
                  initial="hidden"
                  animate="show"
                  className="space-y-1 px-2 py-3"
                  dir="rtl"
                >
                  <AnimatePresence mode="popLayout">
                    {messages.map((message) => {
                      const mine = message.user_id === userId;
                      const label =
                        message.author_label || (mine ? "إنت" : "عضو");
                      const reactionEntries = Object.entries(
                        message.reactions ?? {},
                      ).filter(([, users]) => users.length > 0);

                      const openPeerDmFromMessage = () => {
                        if (mine || !message.user_id) return;
                        openPeerDm(message.user_id, label);
                      };

                      const hasUnread = unreadSenders.has(message.user_id);
                      const authorTitle =
                        message.author_title ||
                        authorMeta[message.user_id]?.title ||
                        null;
                      const trimmedBody = (message.body ?? "").trim();
                      const showText =
                        trimmedBody.length > 0 &&
                        trimmedBody !== "صورة" &&
                        trimmedBody !== "(صورة)";
                      const replyBody = (message.reply_to?.body ?? "").trim();
                      const showReplyBody =
                        replyBody.length > 0 &&
                        replyBody !== "صورة" &&
                        replyBody !== "(صورة)";
                      const menuOpen = menuFor === message.id;

                      return (
                        <motion.article
                          key={message.id}
                          variants={item}
                          layout
                          className={`group relative flex flex-row gap-3 overflow-visible rounded-xl px-4 py-3 text-right ${
                            mine ? "bg-yellow-400/5" : "hover:bg-white/5"
                          }`}
                        >
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (mine) return;
                                setMenuFor((id) =>
                                  id === message.id ? null : message.id,
                                );
                              }}
                              disabled={mine}
                              title={mine ? undefined : `رسالة إلى ${label}`}
                              className={`relative flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[0.65rem] font-medium text-yellow-400 ${
                                mine
                                  ? "cursor-default"
                                  : "cursor-pointer transition hover:border-yellow-400/50 hover:bg-yellow-400/10"
                              }`}
                            >
                              {label.slice(0, 2)}
                              {!mine && hasUnread ? (
                                <span className="absolute -start-0.5 -top-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-[#050505]" />
                              ) : null}
                            </button>
                            {!mine ? (
                              <MemberActionMenu
                                open={menuOpen}
                                onClose={() => setMenuFor(null)}
                                memberName={label}
                                onMessage={openPeerDmFromMessage}
                                canBlock={canModerate}
                                onBlock={() =>
                                  void onBlockUser(message.user_id)
                                }
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <p className="text-sm">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (mine) return;
                                    setMenuFor((id) =>
                                      id === message.id ? null : message.id,
                                    );
                                  }}
                                  disabled={mine}
                                  className={`font-medium ${
                                    mine
                                      ? "cursor-default text-white"
                                      : "text-white transition hover:text-yellow-400 hover:underline"
                                  }`}
                                >
                                  {label}
                                </button>
                                <span className="me-2 text-xs text-slate-500">
                                  {formatMessageTime(message.created_at)}
                                </span>
                              </p>
                              {authorTitle ? (
                                <RoleBadge title={authorTitle} />
                              ) : null}
                              {canModerate ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void onDeleteMessage(message.id)
                                  }
                                  className="rounded-full border border-red-400/20 px-2 py-0.5 text-[0.7rem] text-red-300/90 transition hover:border-red-400/50 hover:bg-red-500/10"
                                  aria-label="حذف الرسالة"
                                  title="حذف"
                                >
                                  🗑
                                </button>
                              ) : null}
                            </div>

                            {message.reply_to ? (
                              <div className="mt-2 rounded-lg border-s-2 border-yellow-400/50 bg-white/5 px-3 py-2 text-right">
                                <p className="text-[0.65rem] font-medium text-yellow-400/90">
                                  رد على{" "}
                                  {message.reply_to.author_label || "عضو"}
                                </p>
                                {showReplyBody ? (
                                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                                    {message.reply_to.body}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}

                            {showText ? (
                              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                                {trimmedBody}
                              </p>
                            ) : null}

                            {message.image_url ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxSrc(message.image_url)
                                }
                                className={`relative ms-auto block w-full max-w-sm overflow-hidden rounded-xl border border-white/10 transition hover:border-yellow-400/40 ${
                                  showText || message.reply_to ? "mt-3" : "mt-1.5"
                                }`}
                              >
                                <span className="relative block aspect-[4/3] w-full">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={message.image_url}
                                    alt=""
                                    className="h-full w-full rounded-xl object-cover"
                                    loading="lazy"
                                  />
                                </span>
                              </button>
                            ) : null}

                            {reactionEntries.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {reactionEntries.map(([emoji, users]) => {
                                  const active =
                                    !!userId && users.includes(userId);
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() =>
                                        void onReact(message.id, emoji)
                                      }
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
                                        active
                                          ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-400"
                                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{users.length}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}

                            <div className="mt-2 flex flex-wrap items-center gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => setReplyTo(message)}
                                className="rounded-full border border-white/10 px-2.5 py-1 text-[0.7rem] text-slate-400 hover:border-yellow-400/40 hover:text-yellow-400"
                              >
                                رد
                              </button>
                              {QUICK_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() =>
                                    void onReact(message.id, emoji)
                                  }
                                  className="rounded-full border border-transparent px-1.5 py-0.5 text-sm hover:border-white/15 hover:bg-white/5"
                                  aria-label={`تفاعل ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                              <div className="relative" ref={reactPickerFor === message.id ? reactPickerRef : undefined}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReactPickerFor((id) =>
                                      id === message.id ? null : message.id,
                                    )
                                  }
                                  className="rounded-full border border-white/10 px-2 py-1 text-[0.7rem] text-slate-400 hover:border-yellow-400/40 hover:text-yellow-400"
                                >
                                  +
                                </button>
                                {reactPickerFor === message.id ? (
                                  <div className="emoji-picker-shell absolute bottom-full end-0 z-20 mb-2 overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                                    <EmojiPicker
                                      theme={Theme.DARK}
                                      height={320}
                                      width={300}
                                      searchPlaceHolder="بحث…"
                                      previewConfig={{ showPreview: false }}
                                      skinTonesDisabled
                                      onEmojiClick={(data) =>
                                        void onReact(message.id, data.emoji)
                                      }
                                    />
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </RtlScroll>

            {announcementsReadOnly ? (
              <div
                dir="rtl"
                className="shrink-0 border-t border-white/10 bg-white/[0.04] px-4 py-6 text-center"
                role="status"
                aria-live="polite"
              >
                <p className="text-sm font-medium text-slate-200">
                  هذه القناة للقراءة فقط - مخصصة لرسائل الإدارة
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  تقدر تقرأ رسائل الإدارة هنا، لكن مفيش إمكانية للكتابة أو رفع
                  صور.
                </p>
              </div>
            ) : (
            <form
              dir="rtl"
              className="shrink-0 border-t border-white/10 p-4 text-right"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              {notice ? (
                <p className="mb-2 text-right text-xs text-yellow-400/90">
                  {notice}
                </p>
              ) : null}

              {replyTo ? (
                <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-3 py-2 text-right">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] font-medium text-yellow-400">
                      رد على {replyTo.author_label || "عضو"}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-300">
                      {replyTo.body}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="shrink-0 text-xs text-slate-400 hover:text-white"
                    aria-label="إلغاء الرد"
                  >
                    ✕
                  </button>
                </div>
              ) : null}

              {chatMuted ? (
                <p className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-300">
                  تم إيقاف حسابك من إرسال الرسائل
                </p>
              ) : null}

              <div
                className={`relative rounded-2xl border bg-white/5 p-3 backdrop-blur-md ${
                  chatMuted
                    ? "border-red-400/25 opacity-60"
                    : "border-white/10 focus-within:border-yellow-400/35"
                }`}
              >
                <textarea
                  rows={2}
                  value={draft}
                  disabled={chatMuted}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (chatMuted) return;
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  placeholder={
                    chatMuted
                      ? "تم إيقاف حسابك من إرسال الرسائل"
                      : replyTo
                        ? `رد على ${replyTo.author_label || "الرسالة"}…`
                        : isPhotos
                          ? "وصف الفريم أو تعليق…"
                          : `رسالة إلى ${channelLabel(activeChannel?.name ?? "")}`
                  }
                  className="w-full resize-none bg-transparent text-right text-sm leading-relaxed text-white outline-none placeholder:text-red-300/80 disabled:cursor-not-allowed disabled:placeholder:text-red-300"
                />
                <div className="mt-2 flex flex-row-reverse flex-wrap items-center justify-between gap-2">
                  <button
                    type="submit"
                    disabled={
                      chatMuted || sending || (!draft.trim() && !file)
                    }
                    className="rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-medium text-[#050505] disabled:opacity-35"
                  >
                    {sending ? "…" : "ابعت"}
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative" ref={pickerRef}>
                      <button
                        type="button"
                        disabled={chatMuted}
                        onClick={() => setPickerOpen((o) => !o)}
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-yellow-400/40 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="إيموجي"
                      >
                        😊
                      </button>
                      {pickerOpen && !chatMuted ? (
                        <div className="emoji-picker-shell absolute bottom-full start-0 z-30 mb-2 overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                          <EmojiPicker
                            theme={Theme.DARK}
                            height={360}
                            width={320}
                            searchPlaceHolder="بحث…"
                            previewConfig={{ showPreview: false }}
                            skinTonesDisabled
                            onEmojiClick={onEmojiPick}
                          />
                        </div>
                      ) : null}
                    </div>
                    <label
                      className={`rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 ${
                        chatMuted
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer hover:border-yellow-400/40 hover:text-yellow-400"
                      }`}
                    >
                      {file ? file.name : "ارفع من جهازك"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={chatMuted}
                        onChange={(e) =>
                          setFile(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </form>
            )}
          </>
        )}
      </section>

      <ImageLightbox
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />

      {activeChatUser ? (
        <DirectMessageDrawer
          user={activeChatUser}
          onClose={handleDmClose}
          incomingMessage={liveIncoming}
          onOpenedPeer={handleOpenedPeer}
        />
      ) : null}
    </div>
  );
}

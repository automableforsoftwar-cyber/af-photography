"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DirectMessageDrawer,
  type ActiveChatUser,
} from "@/components/community/DirectMessageDrawer";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { RtlScroll } from "@/components/ui/RtlScroll";
import {
  fetchMyAmgadMessages,
  fetchStaffAmgadInbox,
  sendAmgadMessage,
  type AmgadInboxThread,
  type AmgadMessage,
} from "@/lib/amgad-messages";
import { useAuthStore } from "@/lib/auth-store";
import { pickDisplayName } from "@/lib/display-name";
import { uploadCommunityImage } from "@/lib/storage";
import { useLiveStaffRole } from "@/lib/use-live-staff";

type AmgadInboxProps = {
  courseId: string;
};

/**
 * Students: contact admin (أمجد فريد).
 * Staff: unified inbox list of students who messaged — open peer DM to reply.
 */
export function AmgadInbox({ courseId }: AmgadInboxProps) {
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const { isStaff, isChatBlocked, isBlocked } = useLiveStaffRole();
  const chatMuted = isBlocked || isChatBlocked;

  if (isStaff) {
    return <StaffStudentInbox courseId={courseId} />;
  }

  return (
    <StudentAdminContact
      courseId={courseId}
      senderName={pickDisplayName(fullName, email)}
      chatMuted={chatMuted}
    />
  );
}

function StudentAdminContact({
  courseId,
  senderName,
  chatMuted,
}: {
  courseId: string;
  senderName: string;
  chatMuted: boolean;
}) {
  const [messages, setMessages] = useState<AmgadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchMyAmgadMessages(courseId);
    setMessages(data);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (sending || chatMuted) return;
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

    const result = await sendAmgadMessage({
      courseId,
      body: draft,
      senderName,
      imageUrl,
    });
    setSending(false);
    if (!result.ok) {
      setNotice(
        result.message === "chat_blocked" || result.message === "blocked"
          ? "تم إيقاف حسابك من إرسال الرسائل"
          : "مقدرناش نبعت الرسالة. تأكد إن اشتراكك شغال.",
      );
      return;
    }
    setDraft("");
    setFile(null);
    setMessages((prev) => [...prev, result.message]);
  };

  return (
    <div
      dir="rtl"
      className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent text-right"
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4 text-right">
        <h2 className="font-display text-lg font-bold text-white">أمجد فريد</h2>
        <p className="mt-0.5 text-xs text-slate-400">
          راسل الإدارة مباشرة — الرسالة هتوصل لفريق AF P.
        </p>
      </header>

      <RtlScroll className="min-h-0 flex-1 px-4 py-4">
        {loading ? (
          <p className="text-right text-sm text-slate-500">بنحمّل الرسائل…</p>
        ) : messages.length === 0 ? (
          <p className="text-right text-sm text-slate-500">
            لسه مبعتش حاجة — اكتب أول رسالة للإدارة.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => (
              <li key={m.id} className="flex w-full justify-start">
                <article className="max-w-[min(100%,28rem)] rounded-2xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-right">
                  <p className="text-xs text-slate-500">
                    {new Date(m.created_at).toLocaleString("ar-EG")}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-100">
                    {m.body}
                  </p>
                  {m.image_url ? (
                    <button
                      type="button"
                      onClick={() => setLightboxSrc(m.image_url)}
                      className="relative mt-3 ms-auto block aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-white/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        )}
      </RtlScroll>

      {chatMuted ? (
        <p className="shrink-0 border-t border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-300">
          تم إيقاف حسابك من إرسال الرسائل
        </p>
      ) : (
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
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب رسالتك للإدارة…"
            className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-right text-sm text-white outline-none focus:border-yellow-400/40"
          />
          <div className="mt-2 flex flex-row-reverse flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={sending || (!draft.trim() && !file)}
              className="rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-medium text-[#050505] disabled:opacity-35"
            >
              {sending ? "جاري…" : "إرسال"}
            </button>
            <label className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-yellow-400/40 hover:text-yellow-400">
              {file ? file.name : "ارفع صورة"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </form>
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

function StaffStudentInbox({ courseId }: { courseId: string }) {
  const [threads, setThreads] = useState<AmgadInboxThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveChatUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchStaffAmgadInbox(courseId);
    setThreads(data);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div
      dir="rtl"
      className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent text-right"
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4 text-right">
        <h2 className="font-display text-lg font-bold text-white">
          صندوق الوارد
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          رسائل المشتركين — اضغط اسم الطالب عشان تفتح المحادثة الخاصة وترد.
        </p>
      </header>

      <RtlScroll className="min-h-0 flex-1 px-3 py-3">
        {loading ? (
          <p className="px-2 py-6 text-sm text-slate-500">بنحمّل الوارد…</p>
        ) : threads.length === 0 ? (
          <p className="px-2 py-6 text-sm text-slate-500">
            مفيش رسائل من المشتركين في آخر ٣ أيام.
          </p>
        ) : (
          <ul className="space-y-1">
            {threads.map((t) => (
              <li key={t.peerUserId}>
                <button
                  type="button"
                  onClick={() =>
                    setActive({ userId: t.peerUserId, name: t.peerName })
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-right transition hover:border-white/10 hover:bg-white/5"
                >
                  <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/10 text-xs font-medium text-yellow-400">
                    {t.peerName.slice(0, 2)}
                    {t.unreadHint ? (
                      <span className="absolute -start-0.5 -top-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-[#050505]" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">
                      {t.peerName}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {t.lastBody}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.65rem] text-slate-600">
                    {new Date(t.lastMessageAt).toLocaleDateString("ar-EG")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </RtlScroll>

      {active ? (
        <DirectMessageDrawer
          user={active}
          onClose={() => {
            setActive(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

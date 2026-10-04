"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { RtlScroll } from "@/components/ui/RtlScroll";
import {
  fetchMyAmgadMessages,
  fetchStaffAmgadInbox,
  fetchStaffAmgadThread,
  sendAmgadMessage,
  sendStaffAmgadReply,
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
 * Staff: unified inbox list of students who messaged — open thread to reply.
 */
export function AmgadInbox({ courseId }: AmgadInboxProps) {
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const { isStaff, isChatBlocked, isBlocked } = useLiveStaffRole();
  const chatMuted = isBlocked || isChatBlocked;

  if (isStaff) {
    return <StaffStudentInbox fallbackCourseId={courseId} />;
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
          <MessageList
            messages={messages}
            onOpenImage={setLightboxSrc}
            mineId={null}
          />
        )}
      </RtlScroll>

      {chatMuted ? (
        <p className="shrink-0 border-t border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-300">
          تم إيقاف حسابك من إرسال الرسائل
        </p>
      ) : (
        <Composer
          draft={draft}
          setDraft={setDraft}
          file={file}
          setFile={setFile}
          notice={notice}
          sending={sending}
          onSend={() => void send()}
          placeholder="اكتب رسالتك للإدارة…"
        />
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

function StaffStudentInbox({
  fallbackCourseId,
}: {
  fallbackCourseId: string;
}) {
  const [threads, setThreads] = useState<AmgadInboxThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<AmgadInboxThread | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchStaffAmgadInbox(fallbackCourseId);
    setThreads(data);
    setLoading(false);
  }, [fallbackCourseId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (active) {
    return (
      <StaffAmgadThread
        thread={active}
        onBack={() => {
          setActive(null);
          void load();
        }}
      />
    );
  }

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
          رسائل المشتركين عبر «أمجد فريد» — اضغط اسم الطالب عشان تفتح المحادثة
          وترد.
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
                  onClick={() => setActive(t)}
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
    </div>
  );
}

function StaffAmgadThread({
  thread,
  onBack,
}: {
  thread: AmgadInboxThread;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<AmgadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchStaffAmgadThread(
      thread.peerUserId,
      thread.courseId,
    );
    setMessages(data);
    setLoading(false);
  }, [thread.peerUserId, thread.courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (sending) return;
    if (!draft.trim() && !file) return;
    setSending(true);
    setNotice(null);

    let imageUrl: string | null = null;
    if (file) {
      const up = await uploadCommunityImage(file);
      if (!up.ok) {
        setSending(false);
        setNotice("مقدرناش نرفع الصورة.");
        return;
      }
      imageUrl = up.publicUrl;
    }

    const result = await sendStaffAmgadReply({
      courseId: thread.courseId,
      recipientId: thread.peerUserId,
      body: draft,
      imageUrl,
    });
    setSending(false);
    if (!result.ok) {
      setNotice("مقدرناش نبعت الرد. تأكد من صلاحيات الإدارة.");
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
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-yellow-400/40 hover:text-yellow-400"
        >
          ← الوارد
        </button>
        <div className="min-w-0 flex-1 text-right">
          <h2 className="truncate font-display text-base font-bold text-white">
            {thread.peerName}
          </h2>
          <p className="text-[0.65rem] text-slate-500">رد الإدارة للطالب</p>
        </div>
      </header>

      <RtlScroll className="min-h-0 flex-1 px-4 py-4">
        {loading ? (
          <p className="text-sm text-slate-500">بنحمّل المحادثة…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">مفيش رسائل في المحادثة دي.</p>
        ) : (
          <MessageList
            messages={messages}
            onOpenImage={setLightboxSrc}
            mineId="staff"
          />
        )}
      </RtlScroll>

      <Composer
        draft={draft}
        setDraft={setDraft}
        file={file}
        setFile={setFile}
        notice={notice}
        sending={sending}
        onSend={() => void send()}
        placeholder={`رد على ${thread.peerName}…`}
      />

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

function MessageList({
  messages,
  onOpenImage,
  mineId,
}: {
  messages: AmgadMessage[];
  onOpenImage: (src: string | null) => void;
  /** "staff" highlights staff bubbles; null = student view (own vs staff). */
  mineId: "staff" | null;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {messages.map((m) => {
        const fromStaff = Boolean(m.is_from_staff);
        const mine =
          mineId === "staff" ? fromStaff : !fromStaff;
        return (
          <li
            key={m.id}
            className={`flex w-full ${mine ? "justify-start" : "justify-end"}`}
          >
            <article
              className={`max-w-[min(100%,28rem)] rounded-2xl border px-4 py-3 text-right ${
                fromStaff
                  ? "border-yellow-400/25 bg-yellow-400/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <p className="text-xs text-slate-500">
                {fromStaff ? m.sender_name || "الإدارة" : m.sender_name || "مشترك"}{" "}
                · {new Date(m.created_at).toLocaleString("ar-EG")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-100">
                {m.body}
              </p>
              {m.image_url ? (
                <button
                  type="button"
                  onClick={() => onOpenImage(m.image_url)}
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
        );
      })}
    </ul>
  );
}

function Composer({
  draft,
  setDraft,
  file,
  setFile,
  notice,
  sending,
  onSend,
  placeholder,
}: {
  draft: string;
  setDraft: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  notice: string | null;
  sending: boolean;
  onSend: () => void;
  placeholder: string;
}) {
  return (
    <form
      dir="rtl"
      className="shrink-0 w-full border-t border-white/10 bg-black p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-right"
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
    >
      {notice ? (
        <p className="mb-2 text-right text-xs text-yellow-400/90">{notice}</p>
      ) : null}
      <textarea
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
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
  );
}

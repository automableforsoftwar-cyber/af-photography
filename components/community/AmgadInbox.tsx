"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { RtlScroll } from "@/components/ui/RtlScroll";
import {
  fetchMyDirectMessages,
  sendDirectMessage,
  type DirectMessage,
} from "@/lib/direct-messages";
import { uploadCommunityImage } from "@/lib/storage";
import { useAuthStore } from "@/lib/auth-store";

type AmgadInboxProps = {
  courseId: string;
};

export function AmgadInbox({ courseId }: AmgadInboxProps) {
  const email = useAuthStore((s) => s.email);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchMyDirectMessages(courseId);
    setMessages(data);
    setLoading(false);
  }, [courseId]);

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
        setNotice("مقدرناش نرفع الصورة. جرّب تاني.");
        return;
      }
      imageUrl = up.publicUrl;
    }

    const result = await sendDirectMessage({
      courseId,
      body: draft,
      senderName: email.split("@")[0] || "طالب",
      imageUrl,
    });
    setSending(false);
    if (!result.ok) {
      setNotice("مقدرناش نبعت الرسالة لأمجد. تأكد إن اشتراكك شغال.");
      return;
    }
    setDraft("");
    setFile(null);
    setMessages((prev) => [...prev, result.message]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/40">
      <header className="shrink-0 border-b border-white/10 px-5 py-4">
        <p className="text-xs font-medium text-yellow-400">رسالة خاصة</p>
        <h2 className="font-display mt-1 text-lg font-bold text-white">
          إنبوكس أمجد فريد
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          ابعت رسالة أو صورة مباشرة لأمجد — رسائلك محفوظة ومقفولة على حسابك.
        </p>
      </header>

      <RtlScroll className="min-h-0 flex-1 px-4 py-4">
        {loading ? (
          <p className="text-sm text-slate-500">بنحمّل الرسائل…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            لسه مبعتش حاجة — اكتب أول رسالة لأمجد.
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3"
              >
                <p className="text-xs text-slate-500">
                  {new Date(m.created_at).toLocaleString("ar-EG")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-200">
                  {m.body}
                </p>
                {m.image_url ? (
                  <div className="relative mt-3 aspect-video max-w-sm overflow-hidden rounded-lg border border-white/10">
                    <Image
                      src={m.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </RtlScroll>

      <form
        className="shrink-0 border-t border-white/10 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        {notice ? (
          <p className="mb-2 text-xs text-yellow-400/90">{notice}</p>
        ) : null}
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب رسالتك لأمجد…"
          className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/40"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-yellow-400/40 hover:text-yellow-400">
            {file ? file.name : "ارفع صورة من جهازك"}
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
            {sending ? "جاري…" : "ابعت لأمجد"}
          </button>
        </div>
      </form>
    </div>
  );
}

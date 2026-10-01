"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { RtlScroll } from "@/components/ui/RtlScroll";
import {
  fetchMyAmgadMessages,
  sendAmgadMessage,
  type AmgadMessage,
} from "@/lib/amgad-messages";
import { uploadCommunityImage } from "@/lib/storage";
import { useAuthStore } from "@/lib/auth-store";
import { pickDisplayName } from "@/lib/display-name";

type AmgadInboxProps = {
  courseId: string;
};

export function AmgadInbox({ courseId }: AmgadInboxProps) {
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const [messages, setMessages] = useState<AmgadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const senderName = pickDisplayName(fullName, email);

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

    const result = await sendAmgadMessage({
      courseId,
      body: draft,
      senderName,
      imageUrl,
    });
    setSending(false);
    if (!result.ok) {
      setNotice("مقدرناش نبعت الرسالة. تأكد إن اشتراكك شغال.");
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
      </header>

      <RtlScroll className="min-h-0 flex-1 px-4 py-4">
        {loading ? (
          <p className="text-right text-sm text-slate-500">بنحمّل الرسائل…</p>
        ) : messages.length === 0 ? (
          <p className="text-right text-sm text-slate-500">
            لسه مبعتش حاجة — اكتب أول رسالة.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => (
              <li key={m.id} className="flex w-full justify-start">
                <article className="max-w-[min(100%,28rem)] rounded-2xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-right shadow-[0_0_20px_rgba(251,191,36,0.08)]">
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
                      <Image
                        src={m.image_url}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ) : null}
                </article>
              </li>
            ))}
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
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب رسالتك…"
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

      <ImageLightbox
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { RtlScroll } from "@/components/ui/RtlScroll";
import { fetchWinners, type CommunityPost } from "@/lib/community-posts";
import { useAuthStore } from "@/lib/auth-store";
import { deleteCommunityPost } from "@/lib/moderation";

const ease = [0.22, 1, 0.36, 1] as const;

const list = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease },
  },
};

/** معرض الفائزين — most-voted photos for the active course. */
export function DashboardGallery({
  manageMode = false,
}: {
  /** Staff admin: show delete controls on winning entries. */
  manageMode?: boolean;
}) {
  const userId = useAuthStore((s) => s.userId);
  const activeCourseId = useAuthStore((s) => s.activeCourseId);
  const [winners, setWinners] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchWinners(userId, activeCourseId ?? null, 24);
    setWinners(data);
    setLoading(false);
  }, [userId, activeCourseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async (postId: string) => {
    if (!manageMode) return;
    setBusyId(postId);
    const result = await deleteCommunityPost(postId);
    setBusyId(null);
    if (!result.ok) return;
    setWinners((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <RtlScroll className="h-full pe-4">
      <section aria-labelledby="winners-heading" className="pb-16">
        <div className="mb-8">
          <p className="text-xs font-medium tracking-wide text-yellow-400">
            معرض الفائزين
          </p>
          <h2
            id="winners-heading"
            className="mt-2 font-display text-3xl font-bold text-white"
          >
            الأكثر تصويتاً
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            صور الفائزين حسب عدد الأصوات — الاسم، الصورة، ووصف الفريم.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">بنحمّل الفائزين…</p>
        ) : winners.length === 0 ? (
          <p className="text-sm text-slate-500">
            لسه مفيش فائزين — صوّت على الصور في المسابقات عشان تظهر هنا.
          </p>
        ) : (
          <motion.div
            variants={list}
            initial="hidden"
            animate="show"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {winners.map((photo, index) => (
              <motion.div
                key={photo.id}
                variants={item}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-start backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={() => setLightboxSrc(photo.image_url)}
                  className="relative block aspect-[4/3] w-full transition hover:opacity-95"
                >
                  <Image
                    src={photo.image_url}
                    alt={photo.description || photo.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  {index < 3 ? (
                    <span className="absolute start-3 top-3 rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-bold text-[#050505]">
                      #{index + 1}
                    </span>
                  ) : null}
                </button>
                <div className="space-y-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-white">
                      {photo.user_name || photo.author_label || "فائز"}
                    </p>
                    {manageMode ? (
                      <button
                        type="button"
                        title="حذف"
                        aria-label="حذف المشاركة"
                        disabled={busyId === photo.id}
                        onClick={() => void onDelete(photo.id)}
                        className="shrink-0 rounded-lg border border-red-400/30 bg-red-500/10 p-1.5 text-red-300 transition hover:bg-red-500/20 disabled:opacity-40"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-4"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443H3.415a.75.75 0 0 0 0 1.5h.43l.742 10.392A2.75 2.75 0 0 0 7.33 18.5h5.34a2.75 2.75 0 0 0 2.743-2.415l.742-10.392h.43a.75.75 0 0 0 0-1.5H14v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM9.5 3.75c0-.69.56-1.25 1.25-1.25h.5c.69 0 1.25.56 1.25 1.25v.443h-3V3.75Zm1.75 3.25a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0v-7.5Zm2.5.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Zm-6.25-.75a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-400">
                    {photo.description || photo.title}
                  </p>
                  <p className="text-xs text-yellow-400">
                    {photo.vote_count} صوت
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <ImageLightbox
        src={lightboxSrc}
        alt="فائز"
        onClose={() => setLightboxSrc(null)}
      />
    </RtlScroll>
  );
}

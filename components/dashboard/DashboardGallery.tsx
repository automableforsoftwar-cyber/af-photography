"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { RtlScroll } from "@/components/ui/RtlScroll";
import { fetchWinners, type CommunityPost } from "@/lib/community-posts";
import { useAuthStore } from "@/lib/auth-store";

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
export function DashboardGallery() {
  const userId = useAuthStore((s) => s.userId);
  const activeCourseId = useAuthStore((s) => s.activeCourseId);
  const [winners, setWinners] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchWinners(userId, activeCourseId ?? null, 24);
    setWinners(data);
    setLoading(false);
  }, [userId, activeCourseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = winners.find((w) => w.id === activeId) ?? null;

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
              <motion.button
                key={photo.id}
                type="button"
                variants={item}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveId(photo.id)}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-start backdrop-blur-xl"
              >
                <div className="relative aspect-[4/3]">
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
                </div>
                <div className="space-y-1 p-4">
                  <p className="font-medium text-white">
                    {photo.user_name || photo.author_label || "فائز"}
                  </p>
                  <p className="line-clamp-2 text-sm text-slate-400">
                    {photo.description || photo.title}
                  </p>
                  <p className="text-xs text-yellow-400">
                    {photo.vote_count} صوت
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </section>

      {active ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setActiveId(null)}
        >
          <div
            className="relative max-h-[85svh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={active.image_url}
                alt={active.description || active.title}
                fill
                className="object-cover"
                sizes="90vw"
                unoptimized
              />
            </div>
            <div className="space-y-2 p-5">
              <p className="text-xs font-medium text-yellow-400">الفائز</p>
              <p className="font-display text-xl font-bold text-white">
                {active.user_name || active.author_label || "فائز"}
              </p>
              <p className="text-sm leading-relaxed text-slate-300">
                {active.description || active.title}
              </p>
              <p className="text-xs text-slate-500">{active.vote_count} صوت</p>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="mt-2 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:text-yellow-400"
              >
                قفل
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </RtlScroll>
  );
}

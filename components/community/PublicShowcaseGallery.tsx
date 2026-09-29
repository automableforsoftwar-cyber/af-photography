"use client";

/**
 * FATERINA MODE — public showcase only.
 * View + Vote. No Upload UI exists in this file (never mounts in the DOM).
 * No ranking / leaderboard. Chronological (newest first).
 */

import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { EnrollmentModal } from "@/components/EnrollmentModal";
import {
  fetchCommunityPosts,
  voteOnPost,
  type CommunityPost,
} from "@/lib/community-posts";
import { useAuthStore } from "@/lib/auth-store";

const ease = [0.22, 1, 0.36, 1] as const;

const galleryList = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const galleryItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease },
  },
};

export function PublicShowcaseGallery() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userId = useAuthStore((s) => s.userId);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchCommunityPosts(userId, "newest");
    setPosts(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onVote = async (postId: string) => {
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }
    setBusyId(postId);
    setNotice(null);
    const result = await voteOnPost(postId);
    setBusyId(null);
    if (!result.ok) {
      if (result.message === "login_required") {
        setAuthOpen(true);
        return;
      }
      if (result.message === "already_voted") {
        setNotice("صوّت قبل كده على الصورة دي.");
        return;
      }
      setNotice("مقدرناش نسجّل الصوت. حاول تاني.");
      return;
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, vote_count: result.voteCount, voted: true }
          : p,
      ),
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <div dir="rtl" className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto pe-1">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
          <p className="text-xs font-medium text-yellow-400">معرض الطلبة</p>
          <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
            شوف شغل الطلبة — وصوّت للي عاجبك
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            معرض عام للأحدث أولاً. التصويت بعد تسجيل الدخول. الرفع للطلبة المفعّلين جوه اللوحة بس.
          </p>
          {notice ? (
            <p className="mt-3 text-sm text-yellow-400/90">{notice}</p>
          ) : null}
        </section>

        <section>
          <h3 className="font-display text-xl font-bold text-white">أحدث الصور</h3>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">بنحمّل المعرض…</p>
          ) : posts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">لسه مفيش صور معروضة.</p>
          ) : (
            <motion.div
              variants={galleryList}
              initial="hidden"
              animate="show"
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              {posts.map((entry) => (
                <motion.article
                  key={entry.id}
                  variants={galleryItem}
                  whileHover={{ scale: 1.02 }}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={entry.image_url}
                      alt={entry.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 40vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0 text-start">
                      <p className="truncate font-medium text-white">{entry.title}</p>
                      <p className="text-xs text-slate-500">
                        {entry.author_label ?? "عضو"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(entry.voted) || busyId === entry.id}
                      onClick={() => void onVote(entry.id)}
                      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                        entry.voted
                          ? "border-yellow-400 bg-yellow-400 text-[#050505]"
                          : "border-white/15 text-slate-200 hover:border-yellow-400/50 hover:text-yellow-400"
                      }`}
                    >
                      {entry.voted ? `تم · ${entry.vote_count}` : `تصويت · ${entry.vote_count}`}
                    </button>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </section>
      </div>

      <EnrollmentModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        contextLabel="سجّل دخول عشان تصوّت على شغل الطلبة."
        onSuccess={() => {
          setAuthOpen(false);
          void load();
        }}
      />
    </div>
  );
}

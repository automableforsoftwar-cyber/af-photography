"use client";

/**
 * Public showcase — view photos + vote counts for everyone.
 * Casting a vote requires a fully authenticated account.
 * Guests who click تصويت are blocked and shown Login / Sign Up.
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
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

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
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userId = useAuthStore((s) => s.userId);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** After guest succeeds login from Vote, retry this post once. */
  const [pendingVoteId, setPendingVoteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchCommunityPosts(userId, "newest");
    setPosts(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const castVote = useCallback(async (postId: string) => {
    setBusyId(postId);
    setNotice(null);
    const result = await voteOnPost(postId);
    setBusyId(null);

    if (!result.ok) {
      if (result.message === "login_required") {
        setPendingVoteId(postId);
        setAuthOpen(true);
        return;
      }
      if (result.message === "already_voted") {
        setNotice("صوّت قبل كده على الصورة دي — صوت واحد لكل صورة.");
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, voted: true } : p)),
        );
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
  }, []);

  const onVote = (postId: string) => {
    // Block guests immediately — never hit the API without an account
    if (!hydrated || !isLoggedIn) {
      setPendingVoteId(postId);
      setAuthOpen(true);
      setNotice("لازم تسجّل دخول أو تعمل حساب عشان تصوّت.");
      return;
    }
    void castVote(postId);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <div
        dir="rtl"
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto pe-1"
      >
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
          <p className="text-xs font-medium text-yellow-400">معرض الطلبة</p>
          <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
            شوف شغل الطلبة — وصوّت للي عاجبك
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            الكل يقدر يشوف الصور وعدد الأصوات. التصويت للمستخدمين المسجّلين فقط —
            الضيوف هيتم تحويلهم لتسجيل الدخول / إنشاء حساب.
          </p>
          {notice ? (
            <p className="mt-3 text-sm text-yellow-400/90" role="status">
              {notice}
            </p>
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
                      <p className="truncate font-medium text-white">
                        {entry.user_name || entry.author_label || "عضو"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {entry.description || entry.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {entry.vote_count} صوت
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(entry.voted) || busyId === entry.id}
                      onClick={() => onVote(entry.id)}
                      aria-label={
                        isLoggedIn
                          ? `تصويت على ${entry.title}`
                          : "سجّل دخول عشان تصوّت"
                      }
                      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                        entry.voted
                          ? "border-yellow-400 bg-yellow-400 text-[#050505]"
                          : "border-white/15 text-slate-200 hover:border-yellow-400/50 hover:text-yellow-400"
                      }`}
                    >
                      {entry.voted
                        ? "تم التصويت"
                        : busyId === entry.id
                          ? "…"
                          : "تصويت"}
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
        onClose={() => {
          setAuthOpen(false);
          setPendingVoteId(null);
        }}
        contextLabel="سجّل دخول أو اعمل حساب عشان تصوّت على شغل الطلبة."
        onSuccess={() => {
          setAuthOpen(false);
          setNotice(null);
          void load().then(() => {
            if (pendingVoteId && useAuthStore.getState().isLoggedIn) {
              const id = pendingVoteId;
              setPendingVoteId(null);
              void castVote(id);
            }
          });
          // Stay on gallery after auth-from-vote (skip forced dashboard redirect)
          return true;
        }}
      />
    </div>
  );
}

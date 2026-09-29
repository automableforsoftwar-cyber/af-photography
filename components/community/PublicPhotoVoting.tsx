"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EnrollmentModal } from "@/components/EnrollmentModal";
import { PremiumButton } from "@/components/ui/PremiumButton";
import {
  fetchCommunityPosts,
  uploadCommunityPost,
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

type PublicPhotoVotingProps = {
  /**
   * public = showcase for outsiders (no upload, no leaderboard, newest first).
   * competition = activated students inside dashboard (upload + ranking).
   */
  variant?: "public" | "competition";
};

export function PublicPhotoVoting({
  variant = "public",
}: PublicPhotoVotingProps) {
  const isPublic = variant === "public";
  // STRICT: public outsiders never upload — only competition/dashboard students
  const canUpload = !isPublic;
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authContext, setAuthContext] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchCommunityPosts(
      userId,
      isPublic ? "newest" : "votes",
    );
    setPosts(data);
    setLoading(false);
  }, [userId, isPublic]);

  useEffect(() => {
    void load();
  }, [load]);

  const ranked = useMemo(
    () => [...posts].sort((a, b) => b.vote_count - a.vote_count),
    [posts],
  );

  const requireAuth = (reason: string) => {
    setAuthContext(reason);
    setAuthOpen(true);
  };

  const onVote = async (postId: string) => {
    if (!isLoggedIn) {
      requireAuth("سجّل دخول عشان تصوّت على شغل الطلبة.");
      return;
    }
    setBusyId(postId);
    setNotice(null);
    const result = await voteOnPost(postId);
    setBusyId(null);
    if (!result.ok) {
      if (result.message === "login_required") {
        requireAuth("سجّل دخول عشان تصوّت.");
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

  const onUpload = async () => {
    if (!canUpload) return;
    if (!isLoggedIn) return;
    setUploadBusy(true);
    setNotice(null);
    const result = await uploadCommunityPost({
      title,
      imageUrl,
      authorLabel: email.split("@")[0] || "عضو",
    });
    setUploadBusy(false);
    if (!result.ok) {
      setNotice("مقدرناش نرفع الصورة. تأكد من العنوان والرابط.");
      return;
    }
    setTitle("");
    setImageUrl("");
    setPosts((prev) => [result.post, ...prev]);
    setNotice("تم نشر الصورة — شكراً للمشاركة.");
  };

  const feed = (
    <div
      dir="rtl"
      className={`flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto pe-1 ${
        isPublic ? "" : "order-1 lg:order-2"
      }`}
    >
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
        <p className="text-xs font-medium text-yellow-400">
          {isPublic ? "معرض الطلبة" : "المسابقات"}
        </p>
        <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
          {isPublic
            ? "شوف شغل الطلبة — وصوّت للي عاجبك"
            : "شارك فريمك… أو صوّت للأحسن"}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {isPublic
            ? "معرض عام للأحدث أولاً. مفيش رفع من هنا — الرفع للطلبة المفعّلين جوه اللوحة بس. التصويت بعد تسجيل الدخول."
            : "ارفع وصوّت من داخل اللوحة بعد تفعيل الكورس."}
        </p>

        {canUpload ? (
          <div className="mt-5 space-y-3 rounded-2xl border border-dashed border-white/20 bg-black/30 p-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان الفريم"
              className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/40"
            />
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="رابط الصورة (https://…)"
              dir="ltr"
              className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/40"
            />
            <PremiumButton
              disabled={uploadBusy || !title.trim() || !imageUrl.trim()}
              onClick={() => void onUpload()}
            >
              {uploadBusy ? "جاري الرفع…" : "انشر"}
            </PremiumButton>
          </div>
        ) : null}
        {notice ? (
          <p className="mt-3 text-sm text-yellow-400/90">{notice}</p>
        ) : null}
      </section>

      <section>
        <h3 className="font-display text-xl font-bold text-white">
          {isPublic ? "أحدث الصور" : "صوّت للصور"}
        </h3>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">بنحمّل المعرض…</p>
        ) : posts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            لسه مفيش صور معروضة.
          </p>
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
                      {entry.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.author_label ?? "عضو"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={Boolean(entry.voted) || busyId === entry.id}
                    onClick={() => void onVote(entry.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                      entry.voted
                        ? "border-yellow-400 bg-yellow-400 text-[#050505]"
                        : "border-white/15 text-slate-200 hover:border-yellow-400/50 hover:text-yellow-400"
                    }`}
                  >
                    ▲ {entry.vote_count}
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );

  return (
    <div
      className={`flex h-full min-h-0 flex-col gap-6 overflow-hidden ${
        isPublic ? "" : "lg:flex-row"
      }`}
    >
      {feed}

      {/* Ranking ONLY inside dashboard competitions — never on public */}
      {!isPublic ? (
        <aside className="order-2 h-fit w-full shrink-0 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl lg:order-1 lg:sticky lg:top-0 lg:w-64 xl:w-72">
          <div dir="rtl">
            <h3 className="font-display text-lg font-bold text-white">
              الترتيب
            </h3>
            <p className="mt-1 text-xs text-slate-500">حسب الأصوات</p>
            <ol className="mt-5 space-y-3">
              {ranked.slice(0, 8).map((entry, index) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0"
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index < 3
                        ? "bg-yellow-400 text-[#050505]"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block truncate text-sm font-medium text-white">
                      {entry.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {entry.author_label ?? "عضو"}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-yellow-400">
                    {entry.vote_count}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      ) : null}

      <EnrollmentModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        contextLabel={authContext}
        onSuccess={() => {
          setAuthOpen(false);
          void load();
        }}
      />
    </div>
  );
}

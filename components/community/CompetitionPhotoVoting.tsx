"use client";

/**
 * Course competition — device file upload only while Admin competition is active.
 * Staff can delete entries and ban users from competitions.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import {
  fetchCommunityPosts,
  uploadCommunityPost,
  voteOnPost,
  type CommunityPost,
} from "@/lib/community-posts";
import {
  competitionPhase,
  fetchActiveCompetitionForCourse,
  fetchActiveCompetitions,
  syncAllCompetitionAnnouncements,
  type Competition,
} from "@/lib/competitions";
import {
  deleteCommunityPost,
  fetchMyProfileFlags,
  setUserCompetitionBlocked,
} from "@/lib/moderation";
import { uploadCommunityImage } from "@/lib/storage";
import { useAuthStore } from "@/lib/auth-store";
import { pickDisplayName } from "@/lib/display-name";
import { useLiveStaffRole } from "@/lib/use-live-staff";

export function CompetitionPhotoVoting() {
  const userId = useAuthStore((s) => s.userId);
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const activeCourseId = useAuthStore((s) => s.activeCourseId);
  const { role } = useLiveStaffRole();
  const isStaffModerator =
    role === "instructor" || role === "organizer";
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeCompetition, setActiveCompetition] =
    useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modBusyId, setModBusyId] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isCompetitionBlocked, setIsCompetitionBlocked] = useState(false);

  const displayName = pickDisplayName(fullName, email);

  const competitionActive = (() => {
    if (!activeCompetition) return false;
    const now = new Date();
    const start = new Date(activeCompetition.starts_at);
    const end = new Date(activeCompetition.ends_at);
    return now >= start && now <= end;
  })();

  const load = useCallback(async () => {
    setLoading(true);
    await syncAllCompetitionAnnouncements();

    const flags = await fetchMyProfileFlags();
    setIsCompetitionBlocked(flags.isCompetitionBlocked);

    let active: Competition | null = null;
    if (activeCourseId) {
      active = await fetchActiveCompetitionForCourse(activeCourseId);
    }
    if (!active) {
      const globals = await fetchActiveCompetitions();
      active = globals[0] ?? null;
    }
    if (active) {
      const now = new Date();
      const start = new Date(active.starts_at);
      const end = new Date(active.ends_at);
      if (
        !(now >= start && now <= end) ||
        competitionPhase(active) !== "active"
      ) {
        active = null;
      }
    }
    setActiveCompetition(active);

    const courseId = activeCourseId ?? active?.course_id ?? null;
    if (!courseId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    const data = await fetchCommunityPosts(userId, "votes", courseId);
    setPosts(data);
    setLoading(false);
  }, [userId, activeCourseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const ranked = useMemo(
    () => [...posts].sort((a, b) => b.vote_count - a.vote_count),
    [posts],
  );

  const onVote = async (postId: string) => {
    setBusyId(postId);
    setNotice(null);
    const result = await voteOnPost(postId);
    setBusyId(null);
    if (!result.ok) {
      if (result.message === "already_voted") {
        setNotice("صوّت قبل كده على الصورة دي — صوت واحد لكل صورة.");
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, voted: true } : p)),
        );
        return;
      }
      if (result.message === "vote_limit") {
        setNotice("وصلت للحد الأقصى من الأصوات اللي حددته الإدارة.");
        return;
      }
      if (result.message === "not_started") {
        setNotice("المسابقة لسه ما بدأتش.");
        return;
      }
      if (result.message === "ended") {
        setNotice("المسابقة خلصت — التصويت مقفول.");
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

  const onDeletePhoto = async (postId: string) => {
    if (!isStaffModerator) return;
    setModBusyId(postId);
    setNotice(null);
    const result = await deleteCommunityPost(postId);
    setModBusyId(null);
    if (!result.ok) {
      setNotice("مقدرناش نحذف الصورة.");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setNotice("تم حذف الصورة.");
  };

  const onBanFromCompetitions = async (targetUserId: string, postId: string) => {
    if (!isStaffModerator || !targetUserId) return;
    setModBusyId(postId);
    setNotice(null);
    const result = await setUserCompetitionBlocked(targetUserId, true);
    setModBusyId(null);
    if (!result.ok) {
      setNotice("مقدرناش نمنع المستخدم من المسابقات.");
      return;
    }
    setNotice("تم منع المستخدم من المشاركة في المسابقات.");
  };

  const onUpload = async () => {
    if (isCompetitionBlocked) {
      setNotice("تم منعك من المشاركة في المسابقات من قبل الإدارة.");
      return;
    }
    if (!competitionActive || !activeCompetition) {
      setNotice("لا توجد مسابقة نشطة حالياً");
      return;
    }
    const courseId = activeCourseId ?? activeCompetition.course_id;
    if (!courseId) {
      setNotice("لازم تفتح كورس مفعّل الأول.");
      return;
    }
    if (!file || !description.trim()) {
      setNotice("وصف الصورة والصورة من جهازك مطلوبين.");
      return;
    }
    setUploadBusy(true);
    setNotice(null);
    const up = await uploadCommunityImage(file);
    if (!up.ok) {
      setUploadBusy(false);
      setNotice("مقدرناش نرفع الصورة من الجهاز.");
      return;
    }
    const result = await uploadCommunityPost({
      description,
      userName: displayName,
      imageUrl: up.publicUrl,
      courseId,
    });
    setUploadBusy(false);
    if (!result.ok) {
      setNotice(
        result.message === "competition_blocked"
          ? "تم منعك من المشاركة في المسابقات من قبل الإدارة."
          : result.message === "no_active_competition"
            ? "لا توجد مسابقة نشطة حالياً"
            : "مقدرناش ننشر الصورة. حاول تاني.",
      );
      if (result.message === "competition_blocked") {
        setIsCompetitionBlocked(true);
      }
      return;
    }
    setDescription("");
    setFile(null);
    setPosts((prev) => [result.post, ...prev]);
    setNotice("تم نشر الصورة — شكراً للمشاركة.");
  };

  const renderUploadArea = () => {
    if (isCompetitionBlocked) {
      return (
        <p className="text-red-500 font-bold text-center">
          تم منعك من المشاركة في المسابقات من قبل الإدارة.
        </p>
      );
    }
    if (!competitionActive) {
      return <p>لا توجد مسابقة نشطة حالياً</p>;
    }
    return (
      <div className="mt-5 space-y-3 rounded-2xl border border-dashed border-white/20 bg-black/30 p-5">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف الصورة"
          required
          rows={2}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/40"
        />
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-full border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-slate-300 hover:border-yellow-400/40">
          <span>{file ? file.name : "اختر صورة من جهازك"}</span>
          <span className="text-xs text-yellow-400">Browse</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <PremiumButton
          disabled={uploadBusy || !file || !description.trim()}
          onClick={() => void onUpload()}
        >
          {uploadBusy ? "جاري الرفع…" : "انشر"}
        </PremiumButton>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden lg:flex-row">
      <div
        dir="rtl"
        className="order-1 flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto pe-1 lg:order-2"
      >
        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 sm:p-6">
          <p className="text-xs font-medium text-yellow-400">المسابقات</p>
          <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
            شارك فريمك… أو صوّت للأحسن
          </h2>
          {isCompetitionBlocked ? null : competitionActive &&
            activeCompetition ? (
            <p className="mt-2 text-sm text-slate-400">
              المسابقة النشطة: {activeCompetition.title}. ارفع من جهازك مع وصف
              الصورة. هتنشر باسمك ({displayName}). صوت واحد لكل صورة لكل مستخدم.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              الرفع متاح فقط أثناء نافذة المسابقة اللي بتحددها الإدارة.
            </p>
          )}

          <div className="mt-5">{renderUploadArea()}</div>
          {notice ? (
            <p className="mt-3 text-sm text-yellow-400/90">{notice}</p>
          ) : null}
        </section>

        <section>
          <h3 className="font-display text-xl font-bold text-white">صوّت للصور</h3>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">بنحمّل المعرض…</p>
          ) : posts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">لسه مفيش صور معروضة.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {posts.map((entry) => (
                <article
                  key={entry.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(entry.image_url)}
                    className="relative aspect-[4/3] w-full overflow-hidden text-start"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.image_url}
                      alt={entry.description || entry.title}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0 text-start">
                      <p className="truncate font-medium text-white">
                        {entry.user_name || entry.author_label || "عضو"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {entry.description || entry.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={
                        Boolean(entry.voted) ||
                        busyId === entry.id ||
                        !competitionActive
                      }
                      onClick={() => void onVote(entry.id)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                        entry.voted
                          ? "border-yellow-400 bg-yellow-400 text-[#050505]"
                          : "border-white/15 text-slate-200 hover:border-yellow-400/50 hover:text-yellow-400"
                      }`}
                    >
                      {entry.voted
                        ? `تم · ${entry.vote_count}`
                        : `▲ ${entry.vote_count}`}
                    </button>
                  </div>
                  {isStaffModerator ? (
                    <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
                      <button
                        type="button"
                        disabled={modBusyId === entry.id}
                        onClick={() => void onDeletePhoto(entry.id)}
                        className="rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 disabled:opacity-50"
                      >
                        حذف الصورة
                      </button>
                      {entry.user_id && entry.user_id !== userId ? (
                        <button
                          type="button"
                          disabled={modBusyId === entry.id}
                          onClick={() =>
                            void onBanFromCompetitions(entry.user_id, entry.id)
                          }
                          className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 disabled:opacity-50"
                        >
                          منع من المسابقات
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="order-2 h-fit w-full shrink-0 rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 lg:order-1 lg:sticky lg:top-0 lg:w-64 xl:w-72">
        <div dir="rtl">
          <h3 className="font-display text-lg font-bold text-white">الترتيب</h3>
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
                    {entry.user_name || entry.author_label || "عضو"}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {entry.description || entry.title}
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

      <ImageLightbox
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}

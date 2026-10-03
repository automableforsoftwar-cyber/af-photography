"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { CommunityView } from "@/components/community/CommunityView";
import { DashboardGallery } from "@/components/dashboard/DashboardGallery";
import { useAuthStore } from "@/lib/auth-store";
import { modules } from "@/lib/content";
import { pickDisplayName } from "@/lib/display-name";
import {
  deleteCommunityPost,
  demoteOrganizer,
  fetchCompetitionLeaderboard,
  fetchInstructorAnalytics,
  fetchOrganizersForInstructor,
  fetchSubscribedProfilesForAdmin,
  promoteToOrganizer,
  setUserBlocked,
  setUserChatBlocked,
  type CompetitionLeaderRow,
  type InstructorAnalytics,
} from "@/lib/moderation";
import { type ProfileModeration } from "@/lib/roles";
import { useLiveStaffRole } from "@/lib/use-live-staff";

type AdminTab =
  | "members"
  | "analytics"
  | "community"
  | "gallery";

type AdminDashboardProps = {
  /** When true, render inside DashboardShell (no duplicate AuthGate/nav). */
  embedded?: boolean;
};

export function AdminDashboard({ embedded = false }: AdminDashboardProps) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const activeCourseId = useAuthStore((s) => s.activeCourseId);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const { ready, isStaff, role, title: myTitle } = useLiveStaffRole();
  const isInstructor = role === "instructor";
  const defaultCourseId = modules[0]?.id ?? "photographer-eye";
  const courseId = activeCourseId ?? defaultCourseId;

  const [tab, setTab] = useState<AdminTab>("members");

  const openCommunity = useCallback(() => {
    if (!activeCourseId) {
      setActiveCourseId(defaultCourseId);
    }
    setTab("community");
  }, [activeCourseId, defaultCourseId, setActiveCourseId]);
  const [users, setUsers] = useState<ProfileModeration[]>([]);
  const [organizers, setOrganizers] = useState<ProfileModeration[]>([]);
  const [leaderboard, setLeaderboard] = useState<CompetitionLeaderRow[]>([]);
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [galleryKey, setGalleryKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, board] = await Promise.all([
      fetchSubscribedProfilesForAdmin(),
      fetchCompetitionLeaderboard(40),
    ]);
    setLeaderboard(board);

    if (isInstructor) {
      const [stats, orgs] = await Promise.all([
        fetchInstructorAnalytics(),
        fetchOrganizersForInstructor(),
      ]);
      setAnalytics(stats);
      setOrganizers(orgs);
      // Ensure organizers appear in the members table even without VIP enrollment
      const byId = new Map(list.map((u) => [u.id, u]));
      for (const o of orgs) {
        byId.set(o.id, o);
      }
      setUsers(Array.from(byId.values()));
    } else {
      setAnalytics(null);
      setOrganizers([]);
      setUsers(list);
    }
    setLoading(false);
  }, [isInstructor]);

  useEffect(() => {
    if (!ready) return;
    if (!isStaff) {
      router.replace("/dashboard/community");
      return;
    }
    void load();
  }, [ready, isStaff, load, router]);

  useEffect(() => {
    if (!isInstructor && tab === "analytics") {
      setTab("members");
    }
  }, [isInstructor, tab]);

  const toggleTotalBlock = async (profile: ProfileModeration) => {
    if (profile.id === userId) {
      setNotice("مينفعش تحظر حسابك.");
      return;
    }
    setBusyId(profile.id);
    setNotice(null);
    const result = await setUserBlocked(profile.id, !profile.is_blocked);
    setBusyId(null);
    if (!result.ok) {
      setNotice("مقدرناش نحدّث الحظر النهائي.");
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === profile.id ? { ...u, is_blocked: !profile.is_blocked } : u,
      ),
    );
    setOrganizers((prev) =>
      prev.map((u) =>
        u.id === profile.id ? { ...u, is_blocked: !profile.is_blocked } : u,
      ),
    );
  };

  const toggleChatMute = async (profile: ProfileModeration) => {
    if (profile.id === userId) {
      setNotice("مينفعش تكمّم حسابك.");
      return;
    }
    setBusyId(`${profile.id}:chat`);
    setNotice(null);
    const result = await setUserChatBlocked(
      profile.id,
      !profile.is_chat_blocked,
    );
    setBusyId(null);
    if (!result.ok) {
      setNotice("مقدرناش نحدّث حظر الشات.");
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === profile.id
          ? { ...u, is_chat_blocked: !profile.is_chat_blocked }
          : u,
      ),
    );
  };

  const removeCompetitionEntry = async (postId: string) => {
    setBusyId(postId);
    setNotice(null);
    const result = await deleteCommunityPost(postId);
    setBusyId(null);
    if (!result.ok) {
      setNotice("مقدرناش نحذف مشاركة المسابقة.");
      return;
    }
    setLeaderboard((prev) => prev.filter((row) => row.postId !== postId));
    setAnalytics((prev) =>
      prev
        ? {
            ...prev,
            hallOfFame: prev.hallOfFame.filter((row) => row.postId !== postId),
          }
        : prev,
    );
    setGalleryKey((k) => k + 1);
  };

  const promoteUser = async (profile: ProfileModeration) => {
    if (!isInstructor) return;
    if (profile.id === userId) {
      setNotice("مينفعش ترقّي حسابك.");
      return;
    }
    if (profile.role !== "student") {
      setNotice("الترقية للطلاب فقط.");
      return;
    }
    setBusyId(`${profile.id}:promote`);
    setNotice(null);
    const result = await promoteToOrganizer(profile.id);
    setBusyId(null);
    if (!result.ok) {
      setNotice("مقدرناش نرقّي العضو لمنظم. تأكد إنك المدرب.");
      return;
    }
    const promoted: ProfileModeration = {
      ...profile,
      role: "organizer",
      title: "المنظم",
    };
    setUsers((prev) =>
      prev.map((u) => (u.id === profile.id ? promoted : u)),
    );
    setOrganizers((prev) => {
      if (prev.some((o) => o.id === profile.id)) return prev;
      return [promoted, ...prev];
    });
    setNotice(`تم ترقية ${pickDisplayName(profile.full_name, profile.email)} لمنظم.`);
  };

  const demoteUser = async (profile: ProfileModeration) => {
    if (!isInstructor) return;
    if (profile.id === userId) return;
    setBusyId(`${profile.id}:demote`);
    setNotice(null);
    const result = await demoteOrganizer(profile.id);
    setBusyId(null);
    if (!result.ok) {
      setNotice("مقدرناش نلغي ترقية المنظم.");
      return;
    }
    setOrganizers((prev) => prev.filter((o) => o.id !== profile.id));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === profile.id
          ? { ...u, role: "student", title: null }
          : u,
      ),
    );
    setNotice(
      `تم إرجاع ${pickDisplayName(profile.full_name, profile.email)} لطالب.`,
    );
  };

  if (!ready || !isStaff) {
    const pending = (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        {ready ? "بنحوّلك للوحة التحكم…" : "بنتحقق من الصلاحيات…"}
      </div>
    );
    return embedded ? pending : <AuthGate>{pending}</AuthGate>;
  }

  const tabs: { id: AdminTab; label: string; instructorOnly?: boolean }[] = [
    { id: "members", label: "إدارة الأعضاء" },
    { id: "analytics", label: "تحليلات الأداء", instructorOnly: true },
    { id: "community", label: "المجتمع" },
    { id: "gallery", label: "معرض الفائزين" },
  ];

  const visibleTabs = tabs.filter((t) => !t.instructorOnly || isInstructor);

  const sidebar = (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 lg:w-56 lg:border-b-0 lg:border-e">
      <div className="border-b border-white/10 px-4 py-4 text-right">
        <p className="text-xs font-medium text-yellow-400">AF P Admin</p>
        <h1 className="mt-1 font-display text-lg font-bold text-white">
          مركز القيادة
        </h1>
        <p className="mt-1 text-[0.7rem] text-slate-500">
          {myTitle ? `${myTitle} · ` : ""}كل أدوات الإدارة في مكان واحد
        </p>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
        {visibleTabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (t.id === "community") {
                  openCommunity();
                  return;
                }
                setTab(t.id);
              }}
              className={`shrink-0 rounded-xl px-3 py-2.5 text-right text-sm font-medium transition ${
                active
                  ? "bg-yellow-400/15 text-yellow-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );

  // Full-bleed community — isolates from Admin sidebar (no layout bleed)
  if (tab === "community") {
    const communityBody = (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => setTab("members")}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:border-yellow-400/40 hover:text-yellow-400"
          >
            ← مركز القيادة
          </button>
          <p className="text-xs text-slate-500">
            مجتمع المسار ·{" "}
            <span className="text-yellow-400">#عام</span>
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CommunityView
            key={`admin-community-${courseId}`}
            courseId={courseId}
            initialTab="general"
          />
        </div>
      </div>
    );
    if (embedded) return communityBody;
    return (
      <AuthGate>
        <div className="relative flex min-h-svh flex-col overflow-x-clip bg-[#050505] px-3 pb-4 pt-20 sm:px-6 lg:px-8">
          <div className="relative flex min-h-0 flex-1 flex-col">
            {communityBody}
          </div>
        </div>
      </AuthGate>
    );
  }

  const panel = (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 text-right sm:p-6">
      {notice ? (
        <p className="mb-4 shrink-0 rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
          {notice}
        </p>
      ) : null}

      {tab === "gallery" ? (
        <div className="space-y-8">
          <DashboardGallery key={galleryKey} manageMode />
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">
              إدارة مشاركات المسابقات
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              احذف المشاركات غير الصالحة من الترتيب.
            </p>
            {loading ? (
              <p className="mt-6 text-sm text-slate-500">بنحمّل…</p>
            ) : leaderboard.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                لسه مفيش مشاركات في المسابقات.
              </p>
            ) : (
              <ol className="mt-6 space-y-3">
                {leaderboard.map((row, index) => (
                  <li
                    key={row.postId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-yellow-400/15 text-sm font-bold text-yellow-400">
                        {index + 1}
                      </span>
                      <div className="min-w-0 text-right">
                        <p className="truncate font-medium text-white">
                          {row.displayName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {row.courseTitle}
                          {row.description ? ` · ${row.description}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-sm font-semibold text-yellow-400">
                        {row.voteCount} صوت
                      </span>
                      <button
                        type="button"
                        title="حذف المشاركة"
                        aria-label="حذف المشاركة"
                        disabled={busyId === row.postId}
                        onClick={() => void removeCompetitionEntry(row.postId)}
                        className="rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:opacity-40"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      ) : loading && tab === "members" ? (
        <p className="mt-6 text-sm text-slate-500">بنحمّل البيانات…</p>
      ) : tab === "members" ? (
        <div className="space-y-6">
          {isInstructor ? (
            <section className="overflow-hidden rounded-2xl border border-yellow-400/20 bg-yellow-400/5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-yellow-400/15 px-5 py-4">
                <div className="text-right">
                  <h2 className="text-lg font-semibold text-white">
                    المنظمين معك
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    فريق الإدارة الحالي — ترقّي الطلاب من الجدول تحت.
                  </p>
                </div>
                <p className="text-xs text-yellow-400/90">
                  {organizers.length} منظم
                </p>
              </div>
              {organizers.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">
                  لسه مفيش منظمين — رقّي طالب من جدول الأعضاء.
                </p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {organizers.map((o) => {
                    const name = pickDisplayName(o.full_name, o.email);
                    return (
                      <li
                        key={o.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
                      >
                        <div className="min-w-0 text-right">
                          <p className="font-medium text-white">{name}</p>
                          <p className="truncate text-xs text-slate-500">
                            {o.email || "—"} · {o.title || "المنظم"}
                            {o.is_blocked ? " · محظور" : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            disabled={busyId === `${o.id}:demote`}
                            onClick={() => void demoteUser(o)}
                            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-40"
                          >
                            {busyId === `${o.id}:demote`
                              ? "…"
                              : "إلغاء الترقية"}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === o.id}
                            onClick={() => void toggleTotalBlock(o)}
                            className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                          >
                            {busyId === o.id
                              ? "…"
                              : o.is_blocked
                                ? "إلغاء الحظر النهائي"
                                : "حظر نهائي"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-semibold text-white">
              الأعضاء المشتركين
            </h2>
            <p className="text-xs text-slate-500">{users.length} مشترك</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead className="bg-white/5 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الاسم</th>
                  <th className="px-4 py-3 font-medium">البريد</th>
                  <th className="px-4 py-3 font-medium">الدور</th>
                  <th className="px-4 py-3 font-medium">الحظر النهائي</th>
                  <th className="px-4 py-3 font-medium">حظر الشات</th>
                  <th className="px-4 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      مفيش مشتركين نشطين حالياً.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const name = pickDisplayName(u.full_name, u.email);
                    const canPromote =
                      isInstructor &&
                      u.role === "student" &&
                      u.id !== userId;
                    const canDemote =
                      isInstructor &&
                      u.role === "organizer" &&
                      u.id !== userId;
                    return (
                      <tr
                        key={u.id}
                        className="border-t border-white/10 text-slate-300"
                      >
                        <td className="px-4 py-3 font-medium text-white">
                          {name}
                        </td>
                        <td className="px-4 py-3">{u.email || "—"}</td>
                        <td className="px-4 py-3">{u.role}</td>
                        <td className="px-4 py-3">
                          {u.is_blocked ? (
                            <span className="text-red-400">محظور</span>
                          ) : (
                            <span className="text-emerald-400">نشط</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.is_chat_blocked ? (
                            <span className="text-orange-400">مكتوم</span>
                          ) : (
                            <span className="text-emerald-400">مسموح</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {canPromote ? (
                              <button
                                type="button"
                                disabled={busyId === `${u.id}:promote`}
                                onClick={() => void promoteUser(u)}
                                className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1.5 text-xs font-medium text-yellow-400 transition hover:bg-yellow-400 hover:text-[#050505] disabled:opacity-40"
                              >
                                {busyId === `${u.id}:promote`
                                  ? "…"
                                  : "ترقية لمنظم"}
                              </button>
                            ) : null}
                            {canDemote ? (
                              <button
                                type="button"
                                disabled={busyId === `${u.id}:demote`}
                                onClick={() => void demoteUser(u)}
                                className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-40"
                              >
                                {busyId === `${u.id}:demote`
                                  ? "…"
                                  : "إلغاء الترقية"}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              disabled={
                                busyId === u.id ||
                                u.id === userId ||
                                u.role === "instructor"
                              }
                              onClick={() => void toggleTotalBlock(u)}
                              className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                            >
                              {busyId === u.id
                                ? "…"
                                : u.is_blocked
                                  ? "إلغاء الحظر النهائي"
                                  : "حظر نهائي"}
                            </button>
                            <button
                              type="button"
                              disabled={
                                busyId === `${u.id}:chat` ||
                                u.id === userId ||
                                u.role === "instructor"
                              }
                              onClick={() => void toggleChatMute(u)}
                              className="rounded-full border border-orange-400/30 px-3 py-1.5 text-xs text-orange-300 transition hover:bg-orange-500/10 disabled:opacity-40"
                            >
                              {busyId === `${u.id}:chat`
                                ? "…"
                                : u.is_chat_blocked
                                  ? "إلغاء حظر الشات"
                                  : "حظر الشات"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
        </div>
      ) : isInstructor && analytics ? (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
              <p className="text-xs text-slate-500">طلاب لهم تقدّم مسجّل</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">
                {analytics.totalStudentsWithProgress}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
              <p className="text-xs text-slate-500">متوسط الدروس المكتملة</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">
                {analytics.avgCompletedLessons}
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">
                تقدّم الطلاب في الكورسات
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-right text-sm">
                <thead className="bg-white/5 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">الطالب</th>
                    <th className="px-4 py-3 font-medium">الكورس</th>
                    <th className="px-4 py-3 font-medium">دروس مكتملة</th>
                    <th className="px-4 py-3 font-medium">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.progress.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        مفيش بيانات تقدّم بعد.
                      </td>
                    </tr>
                  ) : (
                    analytics.progress.map((row) => (
                      <tr
                        key={`${row.userId}-${row.courseId}`}
                        className="border-t border-white/10 text-slate-300"
                      >
                        <td className="px-4 py-3 text-white">
                          {row.displayName}
                        </td>
                        <td className="px-4 py-3">{row.courseTitle}</td>
                        <td className="px-4 py-3">{row.completedCount}</td>
                        <td className="px-4 py-3 text-yellow-400">
                          {row.score}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">قاعة المشاهير</h2>
            <p className="mt-1 text-sm text-slate-500">
              أعلى المشاركين عبر كل المسابقات.
            </p>
            {analytics.hallOfFame.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">لسه فاضي.</p>
            ) : (
              <ol className="mt-4 space-y-2">
                {analytics.hallOfFame.slice(0, 10).map((row, i) => (
                  <li
                    key={row.postId}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm"
                  >
                    <span className="text-slate-200">
                      #{i + 1} {row.displayName}
                    </span>
                    <span className="text-yellow-400">
                      {row.voteCount} صوت
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">بنحمّل البيانات…</p>
      )}
    </div>
  );

  const body = (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505]/40 backdrop-blur-xl lg:flex-row">
      {sidebar}
      {panel}
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <AuthGate>
      <div className="relative flex min-h-svh flex-col overflow-x-clip bg-[#050505] px-4 pb-6 pt-20 sm:px-6 lg:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_60%)]"
        />
        <nav className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-xl">
            <Link
              href="/"
              className="text-sm text-slate-400 transition hover:text-yellow-400"
            >
              الرئيسية
            </Link>
            <span className="text-sm font-semibold text-yellow-400">
              الإدارة
            </span>
            <Link
              href="/dashboard/account"
              className="text-sm text-slate-400 transition hover:text-yellow-400"
            >
              حسابك
            </Link>
          </div>
        </nav>
        <div className="relative flex min-h-0 flex-1 flex-col">{body}</div>
      </div>
    </AuthGate>
  );
}

function TrashIcon() {
  return (
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
  );
}

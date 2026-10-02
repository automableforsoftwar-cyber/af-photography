"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { useAuthStore } from "@/lib/auth-store";
import { pickDisplayName } from "@/lib/display-name";
import {
  deleteCommunityPost,
  fetchCompetitionLeaderboard,
  fetchInstructorAnalytics,
  fetchSubscribedProfilesForAdmin,
  setUserBlocked,
  setUserChatBlocked,
  type CompetitionLeaderRow,
  type InstructorAnalytics,
} from "@/lib/moderation";
import { type ProfileModeration } from "@/lib/roles";
import { useLiveStaffRole } from "@/lib/use-live-staff";

type AdminTab = "members" | "competitions" | "analytics";

type AdminDashboardProps = {
  /** When true, render inside DashboardShell (no duplicate AuthGate/nav). */
  embedded?: boolean;
};

export function AdminDashboard({ embedded = false }: AdminDashboardProps) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const { ready, isStaff, role, title: myTitle } = useLiveStaffRole();
  const isInstructor = role === "instructor";

  const [tab, setTab] = useState<AdminTab>("members");
  const [users, setUsers] = useState<ProfileModeration[]>([]);
  const [leaderboard, setLeaderboard] = useState<CompetitionLeaderRow[]>([]);
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, board] = await Promise.all([
      fetchSubscribedProfilesForAdmin(),
      fetchCompetitionLeaderboard(40),
    ]);
    setUsers(list);
    setLeaderboard(board);

    if (isInstructor) {
      const stats = await fetchInstructorAnalytics();
      setAnalytics(stats);
    } else {
      setAnalytics(null);
    }
    setLoading(false);
  }, [isInstructor]);

  useEffect(() => {
    if (!ready) return;
    if (!isStaff) {
      router.replace("/dashboard/courses");
      return;
    }
    void load();
  }, [ready, isStaff, load, router]);

  useEffect(() => {
    // Organizers must never land on analytics
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
    { id: "competitions", label: "المسابقات" },
    { id: "analytics", label: "تحليلات الأداء", instructorOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.instructorOnly || isInstructor);

  const body = (
    <div className="relative mx-auto w-full max-w-5xl overflow-y-auto pb-8 text-right">
          <p className="text-sm font-medium text-yellow-400">AF P Admin</p>
          <h1 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
            لوحة الإدارة
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {myTitle ? `${myTitle} · ` : ""}
            إدارة الأعضاء والمسابقات
            {isInstructor ? " وتحليلات الأداء" : ""} — بدون أدوات إدارة كورسات.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {visibleTabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "border-yellow-400/50 bg-yellow-400 text-[#050505]"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-yellow-400/30 hover:text-yellow-400"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {notice ? (
            <p className="mt-4 rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
              {notice}
            </p>
          ) : null}

          {loading ? (
            <p className="mt-10 text-sm text-slate-500">بنحمّل البيانات…</p>
          ) : tab === "members" ? (
            <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
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
                                <button
                                  type="button"
                                  disabled={
                                    busyId === u.id || u.id === userId
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
                                    u.id === userId
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
          ) : tab === "competitions" ? (
            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold text-white">
                ترتيب المسابقات
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                أعلى المشاركات حسب عدد الأصوات.
              </p>
              {leaderboard.length === 0 ? (
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
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ) : isInstructor && analytics ? (
            <div className="mt-8 space-y-6">
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
                  <p className="text-xs text-slate-500">طلاب لهم تقدّم مسجّل</p>
                  <p className="mt-2 font-display text-3xl font-bold text-white">
                    {analytics.totalStudentsWithProgress}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
                  <p className="text-xs text-slate-500">
                    متوسط الدروس المكتملة
                  </p>
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
                <h2 className="text-lg font-semibold text-white">
                  قاعة المشاهير
                </h2>
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
          ) : null}
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <AuthGate>
      <div className="relative min-h-svh overflow-x-clip bg-[#050505] px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_60%)]"
        />
        <nav className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-xl">
            <Link
              href="/dashboard/community"
              className="text-sm text-slate-400 transition hover:text-yellow-400"
            >
              المجتمع
            </Link>
            <span className="text-sm font-semibold text-yellow-400">
              الإدارة
            </span>
            <Link
              href="/dashboard/courses"
              className="text-sm text-slate-400 transition hover:text-yellow-400"
            >
              الكورسات
            </Link>
          </div>
        </nav>
        {body}
      </div>
    </AuthGate>
  );
}

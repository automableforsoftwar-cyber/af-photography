"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { useAuthStore } from "@/lib/auth-store";
import { pickDisplayName } from "@/lib/display-name";
import {
  fetchAdminAnalytics,
  fetchAllProfilesForAdmin,
  fetchMyProfileFlags,
  setUserBlocked,
  type AdminAnalytics,
} from "@/lib/moderation";
import { isStaffRole, type ProfileModeration } from "@/lib/roles";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-5 py-5 text-right shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
      <p className="text-xs font-medium tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
        {value}
      </p>
      {hint ? <p className="mt-2 text-[0.7rem] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const myTitle = useAuthStore((s) => s.title);
  const refreshProfileFlags = useAuthStore((s) => s.refreshProfileFlags);
  const [accessChecked, setAccessChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<ProfileModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [stats, list] = await Promise.all([
      fetchAdminAnalytics(),
      fetchAllProfilesForAdmin(),
    ]);
    setAnalytics(stats);
    setUsers(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Live DB check — never trust stale Zustand alone
      const flags = await fetchMyProfileFlags();
      if (cancelled) return;
      await refreshProfileFlags();
      const ok = isStaffRole(flags.role) && !flags.isBlocked;
      setAllowed(ok);
      setAccessChecked(true);
      if (!ok) {
        router.replace("/dashboard/courses");
        return;
      }
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load, refreshProfileFlags, router]);

  const toggleBlock = async (profile: ProfileModeration) => {
    if (profile.id === userId) {
      setNotice("مينفعش تحظر حسابك.");
      return;
    }
    setBusyId(profile.id);
    setNotice(null);
    const result = await setUserBlocked(profile.id, !profile.is_blocked);
    setBusyId(null);
    if (!result.ok) {
      setNotice("مقدرناش نحدّث حالة الحظر. تأكد من صلاحياتك.");
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === profile.id ? { ...u, is_blocked: !profile.is_blocked } : u,
      ),
    );
  };

  if (!accessChecked || !allowed) {
    return (
      <AuthGate>
        <div className="flex min-h-svh items-center justify-center bg-[#050505] text-sm text-slate-500">
          {accessChecked ? "بنحوّلك للوحة التحكم…" : "بنتحقق من الصلاحيات…"}
        </div>
      </AuthGate>
    );
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
            <Link
              href="/dashboard/account"
              className="text-sm text-slate-400 transition hover:text-yellow-400"
            >
              حسابك
            </Link>
          </div>
        </nav>

        <div className="relative mx-auto w-full max-w-5xl text-right">
          <p className="text-sm font-medium text-yellow-400">AF P Admin</p>
          <h1 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
            لوحة الإدارة
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            مرحباً{myTitle ? `، ${myTitle}` : ""} — إحصائيات حية وإدارة
            المستخدمين والحظر.
          </p>

          {notice ? (
            <p className="mt-4 rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
              {notice}
            </p>
          ) : null}

          {loading || !analytics ? (
            <p className="mt-10 text-sm text-slate-500">بنحمّل البيانات…</p>
          ) : (
            <>
              <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="المسجّلون"
                  value={analytics.totalUsers}
                  hint="كل حسابات profiles"
                />
                <StatCard
                  label="اشتراكات نشطة"
                  value={analytics.activeSubscriptions}
                  hint="user_courses غير منتهية"
                />
                <StatCard
                  label="منشورات المجتمع"
                  value={analytics.totalCommunityPosts}
                  hint="community_posts"
                />
                <StatCard
                  label="رسائل القنوات"
                  value={analytics.totalCourseMessages}
                  hint="course_messages"
                />
              </section>

              <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-lg font-semibold text-white">
                  الاشتراكات حسب الكورس
                </h2>
                {analytics.byCourse.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    مفيش اشتراكات نشطة حالياً.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {analytics.byCourse.map((row) => (
                      <li
                        key={row.courseId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                      >
                        <span className="rounded-full bg-yellow-400/15 px-3 py-1 font-semibold text-yellow-400">
                          {row.count}
                        </span>
                        <span className="text-slate-200">{row.courseTitle}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                  <h2 className="text-lg font-semibold text-white">
                    إدارة المستخدمين
                  </h2>
                  <p className="text-xs text-slate-500">
                    {users.length} مستخدم
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-right text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">الاسم</th>
                        <th className="px-4 py-3 font-medium">البريد</th>
                        <th className="px-4 py-3 font-medium">الدور</th>
                        <th className="px-4 py-3 font-medium">اللقب</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                        <th className="px-4 py-3 font-medium">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
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
                            <td className="px-4 py-3">
                              <span
                                className={
                                  u.role === "instructor" ||
                                  u.role === "organizer"
                                    ? "text-yellow-400"
                                    : ""
                                }
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">{u.title || "—"}</td>
                            <td className="px-4 py-3">
                              {u.is_blocked ? (
                                <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-400">
                                  محظور
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-400">
                                  نشط
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                disabled={busyId === u.id || u.id === userId}
                                onClick={() => void toggleBlock(u)}
                                className="rounded-full border border-white/15 px-3 py-1.5 text-xs transition hover:border-yellow-400/40 hover:text-yellow-400 disabled:opacity-40"
                              >
                                {busyId === u.id
                                  ? "…"
                                  : u.is_blocked
                                    ? "إلغاء الحظر"
                                    : "حظر"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

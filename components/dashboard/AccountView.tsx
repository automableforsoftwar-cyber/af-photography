"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AuthButton } from "@/components/AuthButton";
import { getModuleById, modules } from "@/lib/content";
import { pickDisplayName } from "@/lib/display-name";
import { useAuthStore } from "@/lib/auth-store";

export function AccountView() {
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const role = useAuthStore((s) => s.role);
  const title = useAuthStore((s) => s.title);
  const unlockedCourseIds = useAuthStore((s) => s.unlockedCourseIds);
  const activeCourseId = useAuthStore((s) => s.activeCourseId);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const refreshProfileFlags = useAuthStore((s) => s.refreshProfileFlags);
  const active = activeCourseId ? getModuleById(activeCourseId) : null;
  const headline = pickDisplayName(fullName, email) || "عضو AF P";
  const isStaff = role === "instructor" || role === "organizer";

  useEffect(() => {
    void refreshProfileFlags();
  }, [refreshProfileFlags]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <div className="mx-auto mt-6 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0a0a] p-8">
        <p className="text-sm font-medium text-yellow-400">حسابك</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
          {headline}
        </h2>
        {title ? (
          <p className="mt-2 inline-flex rounded-full border border-yellow-400/40 bg-yellow-400/15 px-3 py-1 text-xs font-semibold text-yellow-300">
            {title} · {role}
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">الدور: {role}</p>
        )}
        {fullName.trim() && email ? (
          <p className="mt-2 text-sm text-slate-400" dir="ltr">
            {email}
          </p>
        ) : null}
        {isStaff ? (
          <Link
            href="/dashboard/admin"
            className="mt-4 inline-flex rounded-full border border-yellow-400/50 bg-yellow-400 px-4 py-2 text-sm font-semibold text-[#050505] transition hover:bg-yellow-300"
          >
            فتح لوحة الإدارة
          </Link>
        ) : null}
        <div className="my-4 border-b border-white/10" />
        <p className="text-slate-300 leading-relaxed">
          حسابك مستقل عن الكورسات. تفعيل الأكواد من صفحة «الكورسات» — وتقدر تجمع
          أكتر من مسار على نفس الحساب.
        </p>

        {unlockedCourseIds.length > 0 ? (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-medium text-slate-500">كورساتك المفتوحة</p>
            <ul className="space-y-2">
              {unlockedCourseIds.map((id) => {
                const course = modules.find((m) => m.id === id) ?? getModuleById(id);
                const selected = id === activeCourseId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setActiveCourseId(id)}
                      className={`w-full rounded-xl border px-4 py-3 text-start transition-colors ${
                        selected
                          ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400"
                          : "border-white/10 bg-black/30 text-slate-200 hover:border-white/20"
                      }`}
                    >
                      <span className="block font-medium">{course.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {course.description}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/dashboard/courses"
              className="mt-4 inline-block text-sm font-medium text-yellow-400 hover:underline"
            >
              إدارة الكورسات وتفعيل كود جديد →
            </Link>
          </div>
        ) : (
          <Link
            href="/dashboard/courses"
            className="mt-6 inline-block rounded-full border border-yellow-400/50 bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-[#050505] transition hover:bg-yellow-300"
          >
            اذهب للكورسات لتفعيل كود VIP
          </Link>
        )}

        {active ? (
          <>
            <p className="mt-8 text-sm font-medium text-yellow-400">
              الكورس الحالي
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold text-white">
              {active.title}
            </h3>
            <div className="my-4 border-b border-white/10" />
            <p className="text-slate-300 leading-relaxed">{active.description}</p>
          </>
        ) : null}

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="mb-3 text-xs text-slate-500">
            زر «خروج» في اللوحة بيرجعك للرئيسية ويفضّلك مسجّل. تسجيل الخروج الكامل من هنا:
          </p>
          <AuthButton appearance="plain" intent="logout" />
        </div>
      </div>
    </div>
  );
}

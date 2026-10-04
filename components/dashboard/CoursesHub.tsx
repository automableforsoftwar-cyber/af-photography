"use client";

import Link from "next/link";
import { useMemo } from "react";
import { RedeemCodePanel } from "@/components/dashboard/RedeemCodePanel";
import { modules, getModuleById } from "@/lib/content";
import { useAuthStore } from "@/lib/auth-store";
import { useLiveStaffRole } from "@/lib/use-live-staff";

type CoursesHubProps = {
  onUnlocked?: (courseId: string) => void;
};

/** Catalog + VIP on /dashboard/courses — staff see everything unlocked. */
export function CoursesHub({ onUnlocked }: CoursesHubProps) {
  const unlockedCourseIds = useAuthStore((s) => s.unlockedCourseIds);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const { isStaff } = useLiveStaffRole();

  // Single unique list — never render the same course id twice
  const uniqueCourses = useMemo(() => {
    const seen = new Set<string>();
    return modules.filter((course) => {
      if (seen.has(course.id)) return false;
      seen.add(course.id);
      return true;
    });
  }, []);

  return (
    <div className="flex min-h-0 w-full max-w-full flex-1 flex-col gap-8 overflow-x-hidden overflow-y-auto pb-8">
      <div className="mx-auto w-full max-w-3xl px-1">
        <p className="text-xs font-medium text-yellow-400">الكورسات</p>
        <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
          مساراتك
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {isStaff
            ? "أنت من فريق الإدارة — كل الكورسات مفتوحة بدون كود VIP."
            : "ادخل أي كورس. لو مش مفتوح عندك، هتظهر شاشة تفعيل كود الـ VIP جوه صفحة الكورس — كل كود بيفتح كورس واحد فقط."}
        </p>
      </div>

      {!isStaff ? (
        <div className="mx-auto w-full max-w-3xl px-1">
          <RedeemCodePanel onUnlocked={onUnlocked} />
        </div>
      ) : null}

      {/* One responsive grid only — 1 col mobile, 2 cols desktop (no dual layouts) */}
      <ul className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4 px-1 md:grid-cols-2">
        {uniqueCourses.map((course) => {
          const unlocked = isStaff || unlockedCourseIds.includes(course.id);
          return (
            <li key={`course-card-${course.id}`}>
              <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl font-bold text-white">
                    {course.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${
                      unlocked
                        ? "bg-yellow-400/15 text-yellow-400"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {isStaff ? "إدارة · مفتوح" : unlocked ? "مفتوح" : "مقفول"}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                  {course.description}
                </p>
                <Link
                  href={
                    unlocked
                      ? "/dashboard/community"
                      : `/dashboard/courses/${encodeURIComponent(course.id)}`
                  }
                  onClick={() => {
                    if (unlocked) setActiveCourseId(course.id);
                  }}
                  className={`mt-4 inline-flex items-center justify-center rounded-full border px-4 py-2 text-center text-sm font-semibold ${
                    unlocked
                      ? "border-yellow-400/40 bg-yellow-400 text-[#050505] hover:bg-yellow-300"
                      : "border-white/20 bg-white/5 text-slate-200 hover:border-yellow-400/40 hover:text-yellow-400"
                  }`}
                >
                  {unlocked ? "ابدأ التعلم" : "ادخل — فعّل الكود"}
                </Link>
              </article>
            </li>
          );
        })}
      </ul>

      {isStaff ? (
        <p className="mx-auto max-w-3xl px-1 text-center text-xs text-yellow-400/80">
          مفتاح الإدارة نشط — وصول كامل لكل المسارات بدون اشتراك.
        </p>
      ) : unlockedCourseIds.length > 0 ? (
        <p className="mx-auto max-w-3xl px-1 text-center text-xs text-slate-500">
          مفتوح عندك:{" "}
          {[...new Set(unlockedCourseIds)]
            .map((id) => getModuleById(id).title)
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getModuleById, modules } from "@/lib/content";
import { pickDisplayName } from "@/lib/display-name";
import { useAuthStore } from "@/lib/auth-store";

type CourseRoomProps = {
  courseId: string;
};

/**
 * Unlocked course details inside the dashboard.
 * "ابدأ التعلم" always routes to the main Community — never the AI Assistant.
 */
export function CourseRoom({ courseId }: CourseRoomProps) {
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const known = modules.some((m) => m.id === courseId);
  const course = getModuleById(courseId);

  useEffect(() => {
    setActiveCourseId(courseId);
  }, [courseId, setActiveCourseId]);

  if (!known) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-16 text-center">
        <p className="text-sm text-slate-400">الكورس ده مش موجود.</p>
        <Link
          href="/"
          className="mt-4 text-sm font-medium text-yellow-400 hover:underline"
        >
          الرجوع للرئيسية
        </Link>
      </div>
    );
  }

  const name = pickDisplayName(fullName, email);

  return (
    <div className="premium-scroll mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center overflow-y-auto py-8">
      <p className="text-sm font-medium text-yellow-400">أهلاً بيك</p>
      <h1 className="font-display mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
        مرحباً، {name}
      </h1>
      <p className="mt-4 text-lg text-slate-300">
        أنت داخل مسار «{course.title}».
      </p>

      <section className="mt-10 border-t border-white/10 pt-8">
        <h2 className="font-display text-xl font-bold text-white">عن الكورس</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {course.description}
        </p>
      </section>

      <section className="mt-10 border-t border-white/10 pt-8">
        <h2 className="font-display text-xl font-bold text-white">
          هتتعلّم إيه — وإزاي هيفيدك
        </h2>
        <ul className="mt-4 space-y-3">
          {course.outcomes.map((item) => (
            <li
              key={item}
              className="flex gap-3 text-sm leading-relaxed text-slate-300"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-yellow-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {course.audience.length > 0 ? (
          <p className="mt-6 text-sm leading-relaxed text-slate-500">
            مناسب لـ: {course.audience.join(" · ")}
          </p>
        ) : null}
      </section>

      <Link
        href="/dashboard/community"
        className="mt-12 inline-flex w-fit items-center justify-center rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold text-[#050505] transition hover:bg-yellow-300"
      >
        ابدأ التعلم
      </Link>
    </div>
  );
}

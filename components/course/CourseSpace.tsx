"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AiLearningChat } from "@/components/dashboard/AiLearningChat";
import { RedeemCodePanel } from "@/components/dashboard/RedeemCodePanel";
import { getModuleById, modules } from "@/lib/content";
import { useAuthStore } from "@/lib/auth-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

type CourseSpaceProps = {
  courseId: string;
};

function displayName(email: string) {
  const local = email.split("@")[0]?.trim();
  if (!local) return "متعلّم";
  return local;
}

/**
 * Course space — black-screen VIP lock when not subscribed;
 * personalized welcome + learning when activated.
 * No site navbar / footer / dashboard chrome.
 */
export function CourseSpace({ courseId }: CourseSpaceProps) {
  const router = useRouter();
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const email = useAuthStore((s) => s.email);
  const hasCourse = useAuthStore((s) => s.hasCourse);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const [started, setStarted] = useState(false);

  const known = useMemo(() => modules.some((m) => m.id === courseId), [courseId]);
  const course = getModuleById(courseId);
  const unlocked = hydrated && isLoggedIn && hasCourse(courseId);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) {
      router.replace(`/?auth=1`);
    }
  }, [hydrated, isLoggedIn, router]);

  useEffect(() => {
    if (unlocked) setActiveCourseId(courseId);
  }, [unlocked, courseId, setActiveCourseId]);

  if (!hydrated || !isLoggedIn) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black text-sm text-slate-500">
        …
      </div>
    );
  }

  if (!known) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-black px-6 text-center">
        <p className="text-sm text-slate-400">الكورس ده مش موجود.</p>
        <Link href="/" className="text-sm text-yellow-400 hover:underline">
          ← الرجوع للرئيسية
        </Link>
      </div>
    );
  }

  // ——— BLACK SCREEN activation lock ———
  if (!unlocked) {
    return (
      <div className="flex min-h-svh flex-col bg-black text-white">
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-16">
          <h1 className="font-display max-w-xl text-center text-3xl font-bold leading-snug sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-md text-center text-sm text-slate-500">
            الكورس مقفول — حط كود الـ VIP الخاص بالمسار ده عشان تفتح المحتوى.
          </p>
          <div className="mt-10 w-full max-w-lg">
            <RedeemCodePanel
              expectedCourseId={courseId}
              onUnlocked={(id) => {
                setActiveCourseId(id);
                router.replace(`/course/${encodeURIComponent(id)}`);
              }}
            />
          </div>
          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-white"
          >
            <span aria-hidden="true">←</span>
            الرجوع للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // ——— Activated course main / learning view ———
  const name = displayName(email);

  if (!started) {
    return (
      <div className="min-h-svh bg-black text-white">
        <div className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-5 py-16 sm:px-8">
          <Link
            href="/"
            className="mb-10 inline-flex w-fit items-center gap-2 text-sm text-slate-500 transition-colors hover:text-white"
          >
            <span aria-hidden="true">←</span>
            الرجوع للرئيسية
          </Link>

          <p className="text-sm font-medium text-yellow-400">أهلاً بيك</p>
          <h1 className="font-display mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            مرحباً، {name}
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            أنت داخل مسار «{course.title}».
          </p>

          <section className="mt-10 border-t border-white/10 pt-8">
            <h2 className="font-display text-xl font-bold text-white">
              عن الكورس
            </h2>
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

          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-12 w-fit rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            ابدأ التعلم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-svh flex-col bg-black text-white">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <p className="truncate text-sm text-slate-400">
          <span className="text-yellow-400">{course.title}</span>
          <span className="mx-2 text-slate-600">·</span>
          {name}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setStarted(false)}
            className="text-sm text-slate-500 hover:text-white"
          >
            المقدمة
          </button>
          <Link href="/" className="text-sm text-slate-500 hover:text-white">
            الرئيسية
          </Link>
        </div>
      </div>
      <div className="min-h-0 flex-1 p-3 sm:p-5">
        <AiLearningChat course={course} />
      </div>
    </div>
  );
}

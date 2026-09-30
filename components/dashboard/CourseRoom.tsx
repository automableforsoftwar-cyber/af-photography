"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AiLearningChat } from "@/components/dashboard/AiLearningChat";
import { RedeemCodePanel } from "@/components/dashboard/RedeemCodePanel";
import { getModuleById, modules } from "@/lib/content";
import { useAuthStore } from "@/lib/auth-store";

type CourseRoomProps = {
  courseId: string;
};

/**
 * In-course jail: unlocked → learning content.
 * Locked → dashboard chrome stays; content replaced by VIP code only (no lessons).
 */
export function CourseRoom({ courseId }: CourseRoomProps) {
  const router = useRouter();
  const hasCourse = useAuthStore((s) => s.hasCourse);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const known = modules.some((m) => m.id === courseId);
  const course = getModuleById(courseId);
  const unlocked = hasCourse(courseId);

  if (!known) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-16 text-center">
        <p className="text-sm text-slate-400">الكورس ده مش موجود.</p>
        <Link
          href="/dashboard/courses"
          className="mt-4 text-sm font-medium text-yellow-400 hover:underline"
        >
          رجوع للكورسات
        </Link>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-10">
        <p className="mb-2 text-center text-xs font-medium text-yellow-400">
          تفعيل الكورس
        </p>
        <h2 className="font-display mb-2 text-center text-2xl font-bold text-white">
          {course.title}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-400">
          المحتوى مقفول لحد ما تدخل كود الـ VIP الخاص بالكورس ده. مفيش دروس أو
          تنقل جوه المسار قبل التفعيل.
        </p>
        <RedeemCodePanel
          expectedCourseId={courseId}
          onUnlocked={(id) => {
            setActiveCourseId(id);
            router.replace(`/dashboard/courses/${encodeURIComponent(id)}`);
          }}
        />
        <Link
          href="/dashboard/courses"
          className="mt-6 text-center text-sm font-medium text-slate-500 transition-colors hover:text-yellow-400"
        >
          ← كل الكورسات
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          تتعلّم:{" "}
          <span className="font-medium text-yellow-400">{course.title}</span>
        </p>
        <Link
          href="/dashboard/courses"
          className="text-sm font-medium text-slate-400 transition-colors hover:text-yellow-400"
        >
          ← كل الكورسات
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <AiLearningChat course={course} />
      </div>
    </div>
  );
}

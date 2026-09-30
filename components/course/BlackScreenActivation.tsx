"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RedeemCodePanel } from "@/components/dashboard/RedeemCodePanel";
import { getModuleById } from "@/lib/content";
import { useAuthStore } from "@/lib/auth-store";

/** Literal black screen — course name + VIP + back home. No layout chrome. */
export function BlackScreenActivation({ courseId }: { courseId: string }) {
  const router = useRouter();
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const course = getModuleById(courseId);

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
              router.replace(`/dashboard/courses/${encodeURIComponent(id)}`);
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

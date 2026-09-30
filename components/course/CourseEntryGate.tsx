"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlackScreenActivation } from "@/components/course/BlackScreenActivation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuthStore } from "@/lib/auth-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
import { modules } from "@/lib/content";

/**
 * Locked → black screen only (no dashboard chrome).
 * Unlocked → full dashboard layout around course learning.
 */
export function CourseEntryGate({ courseId }: { courseId: string }) {
  const router = useRouter();
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasCourse = useAuthStore((s) => s.hasCourse);
  const known = modules.some((m) => m.id === courseId);
  const unlocked = hydrated && isLoggedIn && hasCourse(courseId);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) {
      router.replace("/?auth=1");
    }
  }, [hydrated, isLoggedIn, router]);

  if (!hydrated || !isLoggedIn) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black text-sm text-slate-500">
        …
      </div>
    );
  }

  if (!known) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <p className="text-sm text-slate-400">الكورس ده مش موجود.</p>
        <a href="/" className="text-sm text-yellow-400 hover:underline">
          ← الرجوع للرئيسية
        </a>
      </div>
    );
  }

  if (!unlocked) {
    return <BlackScreenActivation courseId={courseId} />;
  }

  return <DashboardShell section="course" courseId={courseId} />;
}

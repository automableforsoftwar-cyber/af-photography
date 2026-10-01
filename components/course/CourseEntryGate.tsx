"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlackScreenActivation } from "@/components/course/BlackScreenActivation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuthStore } from "@/lib/auth-store";
import { modules } from "@/lib/content";
import { useLiveStaffRole } from "@/lib/use-live-staff";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

/**
 * Locked → black screen only (no dashboard chrome).
 * Unlocked → full dashboard layout around course learning.
 * Staff (instructor/organizer) always unlock — Admin Master Key.
 */
export function CourseEntryGate({ courseId }: { courseId: string }) {
  const router = useRouter();
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasCourse = useAuthStore((s) => s.hasCourse);
  const { ready: staffReady, isStaff } = useLiveStaffRole();
  const known = modules.some((m) => m.id === courseId);

  // Master key OR VIP unlock
  const unlocked =
    hydrated &&
    isLoggedIn &&
    staffReady &&
    (isStaff || hasCourse(courseId));

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) {
      router.replace("/?auth=1");
    }
  }, [hydrated, isLoggedIn, router]);

  if (!hydrated || !isLoggedIn || !staffReady) {
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

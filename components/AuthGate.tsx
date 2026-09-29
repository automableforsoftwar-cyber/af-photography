"use client";

import { useEffect, type ReactNode } from "react";
import { CourseStorefront } from "@/components/CourseStorefront";
import { useAuthStore } from "@/lib/auth-store";
import { useProgressStore } from "@/lib/progress-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function AuthGate({ children }: { children: ReactNode }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const authHydrated = usePersistHydrated(useAuthStore.persist);
  const progressHydrated = usePersistHydrated(useProgressStore.persist);
  const hydrated = authHydrated && progressHydrated;

  useEffect(() => {
    if (!authHydrated) {
      void useAuthStore.persist.rehydrate();
    }
    if (!progressHydrated) {
      void useProgressStore.persist.rehydrate();
    }
  }, [authHydrated, progressHydrated]);

  if (!hydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#050505] text-sm font-medium text-slate-400">
        بنجهّز المساحة…
      </div>
    );
  }

  if (!isLoggedIn) {
    return <CourseStorefront />;
  }

  return children;
}

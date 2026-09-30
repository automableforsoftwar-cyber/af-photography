"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useProgressStore } from "@/lib/progress-store";
import { syncAuthCookies } from "@/lib/routing";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

/**
 * Protects dashboard (and similar) routes.
 * Logged-out users are sent to the real homepage (`/?auth=1`) — never an interceptor storefront.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const unlockedCourseIds = useAuthStore((state) => state.unlockedCourseIds);
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

  useEffect(() => {
    if (!authHydrated) return;
    syncAuthCookies({
      isLoggedIn,
      unlockedCount: unlockedCourseIds.length,
    });
  }, [authHydrated, isLoggedIn, unlockedCourseIds]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) {
      router.replace("/?auth=1");
    }
  }, [hydrated, isLoggedIn, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#050505] text-sm font-medium text-slate-400">
        بنجهّز المساحة…
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#050505] text-sm font-medium text-slate-400">
        بنحوّلك للرئيسية…
      </div>
    );
  }

  return children;
}

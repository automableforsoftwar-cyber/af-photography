"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useProgressStore } from "@/lib/progress-store";
import { syncAuthCookies } from "@/lib/routing";
import { useLiveStaffRole } from "@/lib/use-live-staff";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

/**
 * Protects dashboard (and similar) routes.
 * Logged-out users are sent to the real homepage (`/?auth=1`) — never an interceptor storefront.
 * Blocked accounts see a full-screen lockout and cannot use the dashboard.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const unlockedCourseIds = useAuthStore((state) => state.unlockedCourseIds);
  const authHydrated = usePersistHydrated(useAuthStore.persist);
  const progressHydrated = usePersistHydrated(useProgressStore.persist);
  const hydrated = authHydrated && progressHydrated;
  const { ready: flagsReady, isBlocked } = useLiveStaffRole();

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

  if (!flagsReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#050505] text-sm font-medium text-slate-400">
        بنتحقق من الحساب…
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div
        dir="rtl"
        className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#050505] px-6 text-center"
        role="alert"
      >
        <p className="font-display text-2xl font-bold text-red-400 sm:text-3xl">
          تم إيقاف هذا الحساب
        </p>
        <p className="max-w-md text-sm leading-relaxed text-slate-400">
          حسابك متوقف من الإدارة. مفيش صلاحية تدخل لوحة التحكم أو المجتمع أو أي
          جزء من المنصة.
        </p>
        <button
          type="button"
          onClick={() => {
            void useAuthStore.getState().logout();
            router.replace("/?auth=1");
          }}
          className="mt-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-slate-300 transition hover:border-yellow-400/40 hover:text-yellow-400"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return children;
}

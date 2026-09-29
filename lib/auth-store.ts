"use client";

import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchUnlockedCourseIds, signOutSession } from "@/lib/enroll";
import { clearAuthCookies, syncAuthCookies } from "@/lib/routing";
import { supabase } from "@/lib/supabase";

function pushCookies(state: {
  isLoggedIn: boolean;
  unlockedCourseIds: string[];
}) {
  if (!state.isLoggedIn) {
    clearAuthCookies();
    return;
  }
  syncAuthCookies({
    isLoggedIn: true,
    unlockedCount: state.unlockedCourseIds.length,
  });
}

type AuthState = {
  isLoggedIn: boolean;
  userId: string | null;
  email: string;
  unlockedCourseIds: string[];
  activeCourseId: string | null;
  login: (payload: {
    userId: string;
    email: string;
    unlockedCourseIds?: string[];
    activeCourseId?: string | null;
  }) => void;
  setActiveCourseId: (courseId: string | null) => void;
  addUnlockedCourse: (courseId: string) => void;
  hasCourse: (courseId: string) => boolean;
  hydrateFromSession: (session: Session | null) => Promise<void>;
  refreshCourses: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userId: null,
      email: "",
      unlockedCourseIds: [],
      activeCourseId: null,
      login: ({ userId, email, unlockedCourseIds, activeCourseId }) => {
        const next = {
          isLoggedIn: true as const,
          userId,
          email: email.trim().toLowerCase(),
          unlockedCourseIds: unlockedCourseIds ?? get().unlockedCourseIds,
          activeCourseId:
            activeCourseId !== undefined
              ? activeCourseId
              : get().activeCourseId,
        };
        set(next);
        pushCookies(next);
      },
      setActiveCourseId: (courseId) => set({ activeCourseId: courseId }),
      addUnlockedCourse: (courseId) => {
        const nextIds = Array.from(new Set([...get().unlockedCourseIds, courseId]));
        const next = {
          ...get(),
          unlockedCourseIds: nextIds,
          activeCourseId: courseId,
        };
        set({
          unlockedCourseIds: nextIds,
          activeCourseId: courseId,
        });
        pushCookies(next);
      },
      hasCourse: (courseId) => get().unlockedCourseIds.includes(courseId),
      hydrateFromSession: async (session) => {
        if (!session?.user) {
          const cleared = {
            isLoggedIn: false as const,
            userId: null,
            email: "",
            unlockedCourseIds: [] as string[],
            activeCourseId: null,
          };
          set(cleared);
          pushCookies(cleared);
          return;
        }

        const user = session.user as User;
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .maybeSingle();

        const unlocked = await fetchUnlockedCourseIds(user.id);
        const prevActive = get().activeCourseId;
        const activeCourseId =
          prevActive && unlocked.includes(prevActive)
            ? prevActive
            : (unlocked[0] ?? null);

        const next = {
          isLoggedIn: true as const,
          userId: user.id,
          email: profile?.email ?? user.email ?? get().email,
          unlockedCourseIds: unlocked,
          activeCourseId,
        };
        set(next);
        pushCookies(next);
      },
      refreshCourses: async () => {
        const userId = get().userId;
        if (!userId) return;
        const unlocked = await fetchUnlockedCourseIds(userId);
        const prevActive = get().activeCourseId;
        const next = {
          ...get(),
          unlockedCourseIds: unlocked,
          activeCourseId:
            prevActive && unlocked.includes(prevActive)
              ? prevActive
              : (unlocked[0] ?? null),
        };
        set({
          unlockedCourseIds: next.unlockedCourseIds,
          activeCourseId: next.activeCourseId,
        });
        pushCookies(next);
      },
      logout: async () => {
        await signOutSession();
        const cleared = {
          isLoggedIn: false as const,
          userId: null,
          email: "",
          unlockedCourseIds: [] as string[],
          activeCourseId: null,
        };
        set(cleared);
        pushCookies(cleared);
      },
    }),
    {
      name: "af-academy-auth-v4",
      skipHydration: true,
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userId: state.userId,
        email: state.email,
        unlockedCourseIds: state.unlockedCourseIds,
        activeCourseId: state.activeCourseId,
      }),
    },
  ),
);

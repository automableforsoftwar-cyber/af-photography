"use client";

import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchUnlockedCourseIds, signOutSession } from "@/lib/enroll";
import { supabase } from "@/lib/supabase";

type AuthState = {
  isLoggedIn: boolean;
  userId: string | null;
  email: string;
  /** Course IDs unlocked via redeemed codes. */
  unlockedCourseIds: string[];
  /** Active course in the learning hub. */
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
      login: ({ userId, email, unlockedCourseIds, activeCourseId }) =>
        set({
          isLoggedIn: true,
          userId,
          email: email.trim().toLowerCase(),
          unlockedCourseIds: unlockedCourseIds ?? get().unlockedCourseIds,
          activeCourseId:
            activeCourseId !== undefined
              ? activeCourseId
              : get().activeCourseId,
        }),
      setActiveCourseId: (courseId) => set({ activeCourseId: courseId }),
      addUnlockedCourse: (courseId) => {
        const next = new Set(get().unlockedCourseIds);
        next.add(courseId);
        set({
          unlockedCourseIds: Array.from(next),
          activeCourseId: courseId,
        });
      },
      hasCourse: (courseId) => get().unlockedCourseIds.includes(courseId),
      hydrateFromSession: async (session) => {
        if (!session?.user) {
          set({
            isLoggedIn: false,
            userId: null,
            email: "",
            unlockedCourseIds: [],
            activeCourseId: null,
          });
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

        set({
          isLoggedIn: true,
          userId: user.id,
          email: profile?.email ?? user.email ?? get().email,
          unlockedCourseIds: unlocked,
          activeCourseId,
        });
      },
      refreshCourses: async () => {
        const userId = get().userId;
        if (!userId) return;
        const unlocked = await fetchUnlockedCourseIds(userId);
        const prevActive = get().activeCourseId;
        set({
          unlockedCourseIds: unlocked,
          activeCourseId:
            prevActive && unlocked.includes(prevActive)
              ? prevActive
              : (unlocked[0] ?? null),
        });
      },
      logout: async () => {
        await signOutSession();
        set({
          isLoggedIn: false,
          userId: null,
          email: "",
          unlockedCourseIds: [],
          activeCourseId: null,
        });
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

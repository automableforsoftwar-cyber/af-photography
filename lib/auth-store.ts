"use client";

import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchUnlockedCourseIds, signOutSession } from "@/lib/enroll";
import { fetchMyProfileFlags } from "@/lib/moderation";
import { clearAuthCookies, syncAuthCookies } from "@/lib/routing";
import { isStaffRole, type UserRole } from "@/lib/roles";
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

function metaFullName(user: User): string {
  const raw = user.user_metadata?.full_name;
  return typeof raw === "string" ? raw.trim() : "";
}

type AuthState = {
  isLoggedIn: boolean;
  userId: string | null;
  email: string;
  fullName: string;
  role: UserRole;
  title: string | null;
  isBlocked: boolean;
  unlockedCourseIds: string[];
  activeCourseId: string | null;
  login: (payload: {
    userId: string;
    email: string;
    fullName?: string;
    unlockedCourseIds?: string[];
    activeCourseId?: string | null;
    role?: UserRole;
    title?: string | null;
    isBlocked?: boolean;
  }) => void;
  setActiveCourseId: (courseId: string | null) => void;
  addUnlockedCourse: (courseId: string) => void;
  hasCourse: (courseId: string) => boolean;
  isStaff: () => boolean;
  hydrateFromSession: (session: Session | null) => Promise<void>;
  refreshCourses: () => Promise<void>;
  refreshProfileFlags: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userId: null,
      email: "",
      fullName: "",
      role: "student",
      title: null,
      isBlocked: false,
      unlockedCourseIds: [],
      activeCourseId: null,
      login: ({
        userId,
        email,
        fullName,
        unlockedCourseIds,
        activeCourseId,
        role,
        title,
        isBlocked,
      }) => {
        const next = {
          isLoggedIn: true as const,
          userId,
          email: email.trim().toLowerCase(),
          fullName: (fullName ?? get().fullName).trim(),
          role: role ?? get().role,
          title: title !== undefined ? title : get().title,
          isBlocked: isBlocked ?? get().isBlocked,
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
      isStaff: () => isStaffRole(get().role) && !get().isBlocked,
      hydrateFromSession: async (session) => {
        if (!session?.user) {
          const cleared = {
            isLoggedIn: false as const,
            userId: null,
            email: "",
            fullName: "",
            role: "student" as const,
            title: null,
            isBlocked: false,
            unlockedCourseIds: [] as string[],
            activeCourseId: null,
          };
          set(cleared);
          pushCookies(cleared);
          return;
        }

        const user = session.user as User;
        const [{ data: profile }, unlocked, flags] = await Promise.all([
          supabase
            .from("profiles")
            .select("email, full_name, role, title, is_blocked")
            .eq("id", user.id)
            .maybeSingle(),
          fetchUnlockedCourseIds(user.id),
          fetchMyProfileFlags(),
        ]);

        const prevActive = get().activeCourseId;
        const activeCourseId =
          prevActive && unlocked.includes(prevActive)
            ? prevActive
            : (unlocked[0] ?? null);

        const fullName =
          (profile?.full_name as string | null)?.trim() ||
          metaFullName(user) ||
          get().fullName;

        const next = {
          isLoggedIn: true as const,
          userId: user.id,
          email: profile?.email ?? user.email ?? get().email,
          fullName,
          role: flags.role,
          title: flags.title,
          isBlocked: flags.isBlocked,
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
      refreshProfileFlags: async () => {
        const flags = await fetchMyProfileFlags();
        set({
          role: flags.role,
          title: flags.title,
          isBlocked: flags.isBlocked,
        });
      },
      logout: async () => {
        await signOutSession();
        const cleared = {
          isLoggedIn: false as const,
          userId: null,
          email: "",
          fullName: "",
          role: "student" as const,
          title: null,
          isBlocked: false,
          unlockedCourseIds: [] as string[],
          activeCourseId: null,
        };
        set(cleared);
        pushCookies(cleared);
      },
    }),
    {
      name: "af-academy-auth-v6",
      skipHydration: true,
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userId: state.userId,
        email: state.email,
        fullName: state.fullName,
        role: state.role,
        title: state.title,
        isBlocked: state.isBlocked,
        unlockedCourseIds: state.unlockedCourseIds,
        activeCourseId: state.activeCourseId,
      }),
    },
  ),
);

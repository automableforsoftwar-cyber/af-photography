"use client";

import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { signOutSession } from "@/lib/enroll";
import { supabase } from "@/lib/supabase";

type AuthState = {
  isLoggedIn: boolean;
  userId: string | null;
  mobile: string;
  paymentCode: string;
  enrolledCourseId: string | null;
  /** Apply a successful auth result into local state. */
  login: (payload: {
    userId: string;
    mobile: string;
    paymentCode: string;
    courseId: string;
  }) => void;
  setCourseId: (courseId: string) => void;
  /** Sync from Supabase session + profile row. */
  hydrateFromSession: (session: Session | null) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userId: null,
      mobile: "",
      paymentCode: "",
      enrolledCourseId: null,
      login: ({ userId, mobile, paymentCode, courseId }) =>
        set({
          isLoggedIn: true,
          userId,
          mobile: mobile.trim(),
          paymentCode: paymentCode.trim(),
          enrolledCourseId: courseId,
        }),
      setCourseId: (courseId) => set({ enrolledCourseId: courseId }),
      hydrateFromSession: async (session) => {
        if (!session?.user) {
          set({
            isLoggedIn: false,
            userId: null,
            mobile: "",
            paymentCode: "",
            // keep enrolledCourseId cleared on signed-out
            enrolledCourseId: null,
          });
          return;
        }

        const user = session.user as User;
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone_number, used_code")
          .eq("id", user.id)
          .maybeSingle();

        const prevCourse = get().enrolledCourseId;

        set({
          isLoggedIn: true,
          userId: user.id,
          mobile: profile?.phone_number ?? get().mobile,
          paymentCode: profile?.used_code ?? get().paymentCode,
          enrolledCourseId: prevCourse,
        });
      },
      logout: async () => {
        await signOutSession();
        set({
          isLoggedIn: false,
          userId: null,
          mobile: "",
          paymentCode: "",
          enrolledCourseId: null,
        });
      },
    }),
    {
      name: "af-academy-auth-v3",
      skipHydration: true,
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userId: state.userId,
        mobile: state.mobile,
        paymentCode: state.paymentCode,
        enrolledCourseId: state.enrolledCourseId,
      }),
    },
  ),
);

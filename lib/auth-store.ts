"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  isLoggedIn: boolean;
  mobile: string;
  paymentCode: string;
  enrolledCourseId: string | null;
  login: (payload: {
    mobile: string;
    paymentCode: string;
    courseId: string;
  }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      mobile: "",
      paymentCode: "",
      enrolledCourseId: null,
      login: ({ mobile, paymentCode, courseId }) =>
        set({
          isLoggedIn: true,
          mobile: mobile.trim(),
          paymentCode: paymentCode.trim(),
          enrolledCourseId: courseId,
        }),
      logout: () =>
        set({
          isLoggedIn: false,
          mobile: "",
          paymentCode: "",
          enrolledCourseId: null,
        }),
    }),
    {
      name: "af-academy-auth-v2",
      skipHydration: true,
    },
  ),
);

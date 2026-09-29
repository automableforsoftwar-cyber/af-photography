"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProgressState = {
  completedIds: string[];
  completeLesson: (id: string) => void;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedIds: [],
      completeLesson: (id) =>
        set((state) =>
          state.completedIds.includes(id)
            ? state
            : { completedIds: [...state.completedIds, id] },
        ),
    }),
    { name: "lumina-hub-progress", skipHydration: true },
  ),
);

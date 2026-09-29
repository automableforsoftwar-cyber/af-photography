"use client";

import { useSyncExternalStore } from "react";

type PersistHydration = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

export function usePersistHydrated(persist: PersistHydration) {
  return useSyncExternalStore(
    (onStoreChange) => persist.onFinishHydration(onStoreChange),
    () => persist.hasHydrated(),
    () => false,
  );
}

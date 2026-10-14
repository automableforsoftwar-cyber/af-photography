/** Shared chrome for every community channel and the DM drawer. */
export const chatShellClass =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0a0a0a]";

export const chatScrollClass =
  "premium-scroll flex min-h-0 flex-1 flex-col-reverse gap-3 overflow-y-auto overscroll-contain bg-[#0a0a0a] px-4 py-4";

export const chatComposerClass =
  "sticky bottom-0 z-10 w-full shrink-0 border-t border-gray-800 bg-[#0a0a0a] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-right";

export const chatComposerBoxClass =
  "relative rounded-2xl border border-white/10 bg-[#111] p-3 focus-within:border-yellow-400/35";

export const chatBubbleMineClass =
  "max-w-[min(100%,18rem)] self-start rounded-2xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-right";

export const chatBubbleOtherClass =
  "max-w-[min(100%,18rem)] self-end rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right";

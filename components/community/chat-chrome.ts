/** Shared chrome for every community channel and the DM drawer. */
export const chatShellClass =
  "flex flex-col h-screen overflow-hidden bg-[#000000]";

export const chatScrollClass =
  "flex-1 overflow-y-auto flex flex-col-reverse bg-[#000000] px-4 py-4";

export const chatComposerClass =
  "shrink-0 bg-black p-4 w-full sticky bottom-0 z-40 border-t border-gray-800 text-right";

export const chatComposerBoxClass =
  "relative rounded-2xl border border-white/10 bg-[#111] p-3 focus-within:border-yellow-400/35";

/** Forum-style full-width posts — never WhatsApp left/right bubbles. */
export const chatForumPostClass =
  "group relative flex w-full flex-row gap-3 overflow-visible rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right";

export const chatForumPostMineClass =
  "group relative flex w-full flex-row gap-3 overflow-visible rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] px-4 py-3 text-right";

/** @deprecated use chatForumPostClass — kept for DM drawer only */
export const chatBubbleMineClass =
  "w-full rounded-2xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-right";

/** @deprecated use chatForumPostClass — kept for DM drawer only */
export const chatBubbleOtherClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right";

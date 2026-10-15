/** Shared chrome for every community channel and the DM drawer. */
export const chatShellClass =
  "flex flex-col h-screen overflow-hidden bg-[#000000]";

export const chatScrollClass =
  "flex-1 overflow-y-auto flex flex-col-reverse bg-[#000000] px-4 py-6";

export const chatMessageListClass =
  "flex w-full flex-col-reverse gap-y-6 text-right";

export const chatComposerClass =
  "shrink-0 bg-black p-4 w-full sticky bottom-0 z-40 border-t border-gray-800 text-right";

export const chatComposerBoxClass =
  "rounded-xl border border-zinc-800 focus-within:border-yellow-500/50 focus-within:shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)] bg-[#111111] p-3 transition-all";

/** Premium forum post card — full width, spacious, dark gray on black. */
export const chatForumPostClass =
  "group relative w-full rounded-xl border border-white/5 bg-[#111111] p-5 text-right sm:p-6";

export const chatForumPostMineClass =
  "group relative w-full rounded-xl border border-yellow-400/15 bg-[#111111] p-5 text-right sm:p-6";

export const chatForumHeaderClass =
  "mb-3 flex w-full flex-row items-center gap-3 text-right";

export const chatForumBodyClass =
  "w-full text-right text-sm leading-8 text-slate-200";

/** DM drawer bubbles */
export const chatBubbleMineClass =
  "w-full rounded-xl border border-yellow-400/20 bg-[#111111] p-5 text-right";

export const chatBubbleOtherClass =
  "w-full rounded-xl border border-white/5 bg-[#111111] p-5 text-right";

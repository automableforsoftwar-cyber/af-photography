/** Shared chrome for every community channel and the DM drawer. */
export const chatShellClass =
  "flex flex-col h-screen overflow-hidden bg-[#000000]";

export const chatScrollClass =
  "flex-1 overflow-y-auto flex flex-col-reverse bg-[#000000] px-4 py-4";

export const chatComposerClass =
  "shrink-0 bg-black p-4 w-full sticky bottom-0 z-40 border-t border-gray-800 text-right";

export const chatComposerBoxClass =
  "relative rounded-2xl border border-white/10 bg-[#111] p-3 focus-within:border-yellow-400/35";

export const chatBubbleMineClass =
  "max-w-[min(100%,18rem)] self-start rounded-2xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-right";

export const chatBubbleOtherClass =
  "max-w-[min(100%,18rem)] self-end rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right";

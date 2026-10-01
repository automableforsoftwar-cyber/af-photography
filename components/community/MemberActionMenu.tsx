"use client";

import { useEffect, useRef, useState } from "react";

type MemberActionMenuProps = {
  open: boolean;
  onClose: () => void;
  onMessage?: () => void;
  onBlock?: () => void;
  canBlock?: boolean;
  className?: string;
};

export function MemberActionMenu({
  open,
  onClose,
  onMessage,
  onBlock,
  canBlock = false,
  className = "",
}: MemberActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`absolute end-0 top-full z-30 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0c] py-1 shadow-2xl ${className}`}
      role="menu"
    >
      {onMessage ? (
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-right text-sm text-slate-200 hover:bg-white/5 hover:text-yellow-400"
          onClick={() => {
            onMessage();
            onClose();
          }}
        >
          رسالة خاصة
        </button>
      ) : null}
      {canBlock && onBlock ? (
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-right text-sm text-red-300 hover:bg-red-500/10"
          onClick={() => {
            onBlock();
            onClose();
          }}
        >
          حظر المستخدم
        </button>
      ) : null}
    </div>
  );
}

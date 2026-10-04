"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MemberActionMenuProps = {
  open: boolean;
  onClose: () => void;
  onMessage?: () => void;
  onBlock?: () => void;
  canBlock?: boolean;
  memberName?: string;
  className?: string;
};

/**
 * Desktop: compact dropdown near the avatar.
 * Mobile: fixed left drawer + backdrop (dark theme, white/gold text).
 */
export function MemberActionMenu({
  open,
  onClose,
  onMessage,
  onBlock,
  canBlock = false,
  memberName,
  className = "",
}: MemberActionMenuProps) {
  const desktopRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const t = event.target as Node;
      if (desktopRef.current?.contains(t) || drawerRef.current?.contains(t)) {
        return;
      }
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const desktop = (
    <div
      ref={desktopRef}
      role="menu"
      className={`absolute end-0 top-full z-40 mt-2 hidden min-w-[11rem] overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0c] py-1 shadow-2xl lg:block ${className}`}
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

  const mobile =
    mounted &&
    createPortal(
      <>
        <button
          type="button"
          aria-label="إغلاق القائمة"
          className="fixed inset-0 z-[10000] bg-black/50 lg:hidden"
          onClick={onClose}
        />
        <div
          ref={drawerRef}
          role="menu"
          className="fixed inset-y-0 left-0 z-[10001] flex w-64 transform flex-col border-r border-white/10 bg-black transition-transform lg:hidden"
        >
          <div className="border-b border-white/10 px-4 py-4">
            <p className="text-xs font-medium text-yellow-400">إجراءات العضو</p>
            {memberName ? (
              <p className="mt-1 truncate text-sm font-semibold text-white">
                {memberName}
              </p>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-1 p-3">
            {onMessage ? (
              <button
                type="button"
                role="menuitem"
                className="rounded-xl px-3 py-3 text-right text-sm text-white transition hover:bg-white/5 hover:text-yellow-400"
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
                className="rounded-xl px-3 py-3 text-right text-sm text-red-300 transition hover:bg-red-500/10"
                onClick={() => {
                  onBlock();
                  onClose();
                }}
              >
                حظر المستخدم
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="border-t border-white/10 px-4 py-3.5 text-right text-sm text-slate-400"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </>,
      document.body,
    );

  return (
    <>
      {desktop}
      {mobile}
    </>
  );
}

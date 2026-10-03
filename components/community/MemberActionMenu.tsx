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
 * Desktop: compact dropdown near the avatar (in-flow absolute).
 * Mobile: clean bottom sheet via portal (no broken full-screen slider).
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const t = event.target as Node;
      if (desktopRef.current?.contains(t) || sheetRef.current?.contains(t)) {
        return;
      }
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
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
          className="fixed inset-0 z-[10000] bg-black/65 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
        <div
          ref={sheetRef}
          role="menu"
          className="fixed inset-x-0 bottom-0 z-[10001] max-h-[50vh] overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-[#0a0a0a] shadow-[0_-20px_60px_rgba(0,0,0,0.55)] lg:hidden"
        >
          <div className="flex justify-center pt-3 pb-1">
            <span className="h-1 w-10 rounded-full bg-yellow-400/40" />
          </div>
          {memberName ? (
            <p className="border-b border-white/10 px-4 py-3 text-center text-sm font-medium text-white">
              {memberName}
            </p>
          ) : null}
          {onMessage ? (
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-3.5 text-right text-sm text-slate-200 transition hover:bg-white/5 hover:text-yellow-400"
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
              className="block w-full px-4 py-3.5 text-right text-sm text-red-300 transition hover:bg-red-500/10"
              onClick={() => {
                onBlock();
                onClose();
              }}
            >
              حظر المستخدم
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="block w-full border-t border-white/10 px-4 py-3.5 text-right text-sm text-slate-500"
            onClick={onClose}
          >
            إلغاء
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

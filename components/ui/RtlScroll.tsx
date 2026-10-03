"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";

export type RtlScrollHandle = {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
};

export const RtlScroll = forwardRef<
  RtlScrollHandle,
  {
    children: ReactNode;
    className?: string;
  }
>(function RtlScroll({ children, className = "" }, ref) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToBottom: (behavior: ScrollBehavior = "smooth") => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
    },
  }));

  return (
    <div
      ref={scrollerRef}
      dir="ltr"
      className={`premium-scroll min-w-0 overflow-y-auto overflow-x-hidden ${className}`}
    >
      <div dir="rtl" className="min-w-0">
        {children}
      </div>
    </div>
  );
});

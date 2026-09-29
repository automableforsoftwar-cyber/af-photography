"use client";

import type { ReactNode } from "react";

export function RtlScroll({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div dir="ltr" className={`premium-scroll min-w-0 overflow-y-auto overflow-x-hidden ${className}`}>
      <div dir="rtl" className="min-w-0">{children}</div>
    </div>
  );
}

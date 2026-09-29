import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";

export const metadata: Metadata = {
  title: "لوحة التحكم — AF P",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[#050505] text-sm font-medium text-slate-400">
          بنجهّز لوحة التحكم…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

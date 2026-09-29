import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseDashboardView } from "@/components/dashboard/CourseDashboardView";

export const metadata: Metadata = {
  title: "مركز التعلم — AF P · إنسان بعين مصور",
};

export default function CourseDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background text-sm font-medium text-slate-400">
          بنجهّز لوحة الكورس…
        </div>
      }
    >
      <CourseDashboardView />
    </Suspense>
  );
}

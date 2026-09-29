import type { Metadata } from "next";
import { Suspense } from "react";
import { CommunityWorkspace } from "@/components/community/CommunityWorkspace";

export const metadata: Metadata = {
  title: "المجتمع — AF P",
};

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background text-sm font-medium text-slate-400">
          بنفتح الجروب…
        </div>
      }
    >
      <CommunityWorkspace />
    </Suspense>
  );
}

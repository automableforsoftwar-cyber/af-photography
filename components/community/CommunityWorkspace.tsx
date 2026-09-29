"use client";

import { AuthGate } from "@/components/AuthGate";
import { CommunityView } from "@/components/community/CommunityView";

export function CommunityWorkspace() {
  return (
    <AuthGate>
      <div className="flex h-svh flex-col overflow-hidden bg-transparent px-4 py-6 sm:px-8">
        <CommunityView />
      </div>
    </AuthGate>
  );
}

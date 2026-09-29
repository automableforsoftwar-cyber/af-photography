"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CourseModule } from "@/lib/content";
import { AiLearningChat } from "@/components/dashboard/AiLearningChat";
import { AccountView } from "@/components/dashboard/AccountView";
import { CommunityView } from "@/components/community/CommunityView";
import { CompetitionPhotoVoting } from "@/components/community/CompetitionPhotoVoting";
import { DashboardGallery } from "@/components/dashboard/DashboardGallery";
import { HubResources } from "@/components/dashboard/HubResources";
import { InboxView } from "@/components/dashboard/InboxView";
import { RedeemCodePanel } from "@/components/dashboard/RedeemCodePanel";

const ease = [0.22, 1, 0.36, 1] as const;

export type DashboardPanel =
  | "learn"
  | "resources"
  | "challenges"
  | "community"
  | "inbox"
  | "gallery"
  | "account";

type LearningHubProps = {
  course: CourseModule | null;
  hasActiveCourse: boolean;
  panel: DashboardPanel;
  onBackToLearn: () => void;
  onCourseUnlocked?: (courseId: string) => void;
};

export function LearningHub({
  course,
  hasActiveCourse,
  panel,
  onBackToLearn: _onBackToLearn,
  onCourseUnlocked,
}: LearningHubProps) {
  void _onBackToLearn;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 pb-6 pt-2 sm:px-6 lg:px-8">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={panel}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease }}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {panel === "learn" ? (
            hasActiveCourse && course ? (
              <AiLearningChat course={course} />
            ) : (
              <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-8">
                <RedeemCodePanel onUnlocked={onCourseUnlocked} />
              </div>
            )
          ) : panel === "community" ? (
            <CommunityView />
          ) : panel === "inbox" ? (
            <InboxView />
          ) : panel === "challenges" ? (
            <CompetitionPhotoVoting />
          ) : panel === "resources" ? (
            <div className="overflow-y-auto">
              <HubResources />
            </div>
          ) : panel === "gallery" ? (
            <DashboardGallery />
          ) : panel === "account" ? (
            <AccountView />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CourseModule } from "@/lib/content";
import { AiLearningChat } from "@/components/dashboard/AiLearningChat";
import { AccountView } from "@/components/dashboard/AccountView";
import { CommunityView } from "@/components/community/CommunityView";
import { CompetitionPhotoVoting } from "@/components/community/CompetitionPhotoVoting";
import { DashboardGallery } from "@/components/dashboard/DashboardGallery";

const ease = [0.22, 1, 0.36, 1] as const;

export type DashboardPanel =
  | "learn"
  | "challenges"
  | "community"
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
  onCourseUnlocked: _onCourseUnlocked,
}: LearningHubProps) {
  void _onBackToLearn;
  void _onCourseUnlocked;

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
              <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-8 text-center">
                <p className="text-sm text-slate-400">
                  اختار كورس مفتوح أو فعّل كود VIP من صفحة الكورسات.
                </p>
              </div>
            )
          ) : panel === "community" ? (
            course ? (
              <CommunityView courseId={course.id} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                افتح كورس مفعّل أولاً.
              </div>
            )
          ) : panel === "challenges" ? (
            <CompetitionPhotoVoting />
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

"use client";

import { motion } from "framer-motion";
import { RedeemCodePanel } from "@/components/dashboard/RedeemCodePanel";
import { AiLearningChat } from "@/components/dashboard/AiLearningChat";
import { modules, getModuleById, type CourseModule } from "@/lib/content";
import { useAuthStore } from "@/lib/auth-store";

const ease = [0.22, 1, 0.36, 1] as const;

type CoursesHubProps = {
  activeCourse: CourseModule | null;
  onSelectCourse: (courseId: string) => void;
  onUnlocked: (courseId: string) => void;
};

export function CoursesHub({
  activeCourse,
  onSelectCourse,
  onUnlocked,
}: CoursesHubProps) {
  const unlockedCourseIds = useAuthStore((s) => s.unlockedCourseIds);
  const hasCourse = useAuthStore((s) => s.hasCourse);

  if (activeCourse && hasCourse(activeCourse.id)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            تتعلّم:{" "}
            <span className="font-medium text-yellow-400">{activeCourse.title}</span>
          </p>
          <button
            type="button"
            onClick={() => onSelectCourse("")}
            className="text-sm font-medium text-slate-400 transition-colors hover:text-yellow-400"
          >
            ← كل الكورسات
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <AiLearningChat course={activeCourse} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pb-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="mx-auto w-full max-w-3xl"
      >
        <p className="text-xs font-medium text-yellow-400">الكورسات</p>
        <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
          مساراتك
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          حساب واحد يقدر يفتح أكتر من كورس. كل كود VIP بيفتح كورس واحد فقط حسب
          الـ target_course المرتبط بيه.
        </p>
      </motion.div>

      <div className="mx-auto w-full max-w-3xl">
        <RedeemCodePanel onUnlocked={onUnlocked} />
      </div>

      <ul className="mx-auto grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {modules.map((course, index) => {
          const unlocked = unlockedCourseIds.includes(course.id);
          return (
            <motion.li
              key={course.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * index, ease }}
            >
              <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl font-bold text-white">
                    {course.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${
                      unlocked
                        ? "bg-yellow-400/15 text-yellow-400"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {unlocked ? "مفتوح" : "مقفول"}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                  {course.description}
                </p>
                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course.id)}
                    className="mt-4 rounded-full border border-yellow-400/40 bg-yellow-400 px-4 py-2 text-sm font-semibold text-[#050505] transition hover:bg-yellow-300"
                  >
                    ابدأ التعلم
                  </button>
                ) : (
                  <p className="mt-4 text-xs text-slate-500">
                    محتاج كود VIP خاص بالكورس ده.
                  </p>
                )}
              </article>
            </motion.li>
          );
        })}
      </ul>

      {unlockedCourseIds.length > 0 ? (
        <p className="mx-auto max-w-3xl text-center text-xs text-slate-500">
          مفتوح عندك:{" "}
          {unlockedCourseIds
            .map((id) => getModuleById(id).title)
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

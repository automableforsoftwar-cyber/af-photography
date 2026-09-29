"use client";

import { motion } from "framer-motion";
import type { CourseModule } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;

type AccountViewProps = {
  course: CourseModule;
};

export function AccountView({ course }: AccountViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg"
      >
        <p className="text-sm font-medium text-yellow-400">الكورس الحالي</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
          {course.title}
        </h2>
        <div className="my-4 border-b border-white/10" />
        <p className="text-slate-300 leading-relaxed">{course.description}</p>
      </motion.div>
    </div>
  );
}

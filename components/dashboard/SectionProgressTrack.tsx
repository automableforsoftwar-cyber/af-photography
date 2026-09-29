"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { HubSection } from "@/lib/hub-curriculum";

const ease = [0.22, 1, 0.36, 1] as const;

type SectionProgressTrackProps = {
  sections: HubSection[];
  selectedId: string;
  completed: Set<string>;
  onSelectSection: (section: HubSection) => void;
};

function sectionFraction(section: HubSection, completed: Set<string>) {
  if (section.lessons.length === 0) {
    return 0;
  }
  return (
    section.lessons.filter((lesson) => completed.has(lesson.id)).length /
    section.lessons.length
  );
}

export function SectionProgressTrack({
  sections,
  selectedId,
  completed,
  onSelectSection,
}: SectionProgressTrackProps) {
  const selectedIndex = Math.max(
    0,
    sections.findIndex((section) => section.id === selectedId),
  );

  const fillPercent = useMemo(() => {
    const count = sections.length;
    if (count === 0) {
      return 0;
    }

    const current = sections[selectedIndex];
    let units = selectedIndex + (current ? sectionFraction(current, completed) : 0);

    sections.forEach((section, index) => {
      if (sectionFraction(section, completed) === 1) {
        units = Math.max(units, index + 1);
      }
    });

    if (count === 1) {
      return Math.min(100, units * 100);
    }

    return Math.min(100, (units / (count - 1)) * 100);
  }, [completed, sections, selectedIndex]);

  return (
    <div
      className="relative"
      role="navigation"
      aria-label="خط أقسام الكورس"
    >
      <div className="absolute inset-x-5 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full bg-gradient-to-b from-slate-700/70 to-slate-950/95 shadow-[inset_0_1px_3px_rgba(0,0,0,0.72),inset_0_0_0_1px_rgba(255,255,255,0.06)] ring-1 ring-white/10">
        <motion.div
          className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-inline-end from-amber-600 via-amber-400 to-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.38)]"
          initial={false}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.55, ease }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between">
        {sections.map((section, index) => {
          const fraction = sectionFraction(section, completed);
          const selected = section.id === selectedId;
          const done = fraction === 1;
          const reached = index <= selectedIndex || done;

          return (
            <motion.button
              key={section.id}
              type="button"
              layout
              aria-label={section.label}
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelectSection(section)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ layout: { duration: 0.35, ease } }}
              className={`flex size-10 items-center justify-center rounded-xl border text-sm font-bold shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:size-11 ${
                selected
                  ? "border-gold/55 bg-gold/20 text-gold-soft shadow-[0_0_22px_rgba(196,165,116,0.45)]"
                  : done
                    ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                    : reached
                      ? "border-amber-200/35 bg-white/10 text-amber-100"
                      : "border-white/15 bg-[#1a1a1c] text-slate-400"
              }`}
            >
              {section.abbrev}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

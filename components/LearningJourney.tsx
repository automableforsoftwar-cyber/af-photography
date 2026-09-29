"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { journeySteps } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";

const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-50px" } as const;

export function LearningJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.35"],
  });
  const fillScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      id="journey"
      className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
    >
      <SectionHeader
        kicker="رحلة التعلم"
        title="من الأساس… لحد التأثير."
        description="مسار واضح: تفهم، تطبّق، تحترف، وبعدين تدخل السوق بعين واثقة."
      />

      <div ref={ref} className="relative mt-16 max-w-3xl">
        {/* Track */}
        <div
          className="absolute top-3 bottom-3 w-px bg-white/10"
          style={{ insetInlineStart: "0.7rem" }}
          aria-hidden="true"
        />
        {/* Yellow fill on scroll */}
        <motion.div
          className="absolute top-3 w-px origin-top bg-yellow-400 shadow-[0_0_12px_rgba(251,191,36,0.65)]"
          style={{
            insetInlineStart: "0.7rem",
            height: "calc(100% - 1.5rem)",
            scaleY: fillScale,
          }}
          aria-hidden="true"
        />

        <ol className="space-y-10">
          {journeySteps.map((step, index) => (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.5, delay: index * 0.06, ease }}
              className="relative flex gap-5 ps-10"
            >
              <span
                className="absolute top-1.5 flex size-3.5 items-center justify-center rounded-full border-2 border-yellow-400 bg-[#050505] shadow-[0_0_12px_rgba(251,191,36,0.55)]"
                style={{ insetInlineStart: "0.35rem" }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6">
                <p className="text-xs font-medium tracking-wide text-yellow-400">
                  {step.stage}
                </p>
                <h3 className="font-display mt-2 text-xl font-bold text-white sm:text-2xl">
                  {step.title}
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-slate-300">{step.subtitle}</span>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {step.copy}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

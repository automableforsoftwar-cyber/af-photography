"use client";

import { motion } from "framer-motion";
import { gap } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";

const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-50px" } as const;

export function GapSection() {
  return (
    <section
      id="gap"
      className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
    >
      <SectionHeader
        kicker={gap.kicker}
        title={gap.title}
        description={gap.bridge}
      />

      <div className="mt-16 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, ease }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8"
        >
          <p className="text-xs font-medium text-slate-500">التعليم التقليدي</p>
          <h3 className="font-display mt-2 text-2xl font-bold text-slate-400">
            {gap.traditional.title}
          </h3>
          <ul className="mt-6 space-y-3">
            {gap.traditional.items.map((item) => (
              <li
                key={item}
                className="border-s border-white/10 ps-4 text-sm font-medium text-slate-500"
              >
                {item}
              </li>
            ))}
          </ul>
        </motion.article>

        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-xs font-medium text-yellow-400">
            الفجوة
          </span>
          <span className="hidden h-16 w-px bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent lg:block" />
        </div>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 0 40px rgba(251,191,36,0.18)",
          }}
          className="rounded-2xl border border-yellow-400/35 bg-yellow-400/5 p-6 backdrop-blur-md transition-colors hover:border-yellow-400/60 hover:bg-yellow-400/10 sm:p-8"
        >
          <p className="text-xs font-medium text-yellow-400">الواقع</p>
          <h3 className="font-display mt-2 text-2xl font-bold text-white">
            {gap.market.title}
          </h3>
          <ul className="mt-6 space-y-3">
            {gap.market.items.map((item) => (
              <li
                key={item}
                className="border-s border-yellow-400/50 ps-4 text-sm font-medium text-yellow-400/95"
              >
                {item}
              </li>
            ))}
          </ul>
        </motion.article>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.5, delay: 0.12, ease }}
        className="mt-10 max-w-3xl text-sm font-medium leading-relaxed text-slate-400 sm:text-base"
      >
        AF بتبني محترفين يقدروا يفكروا، يقرروا، ويسلّموا — تركيز على الواقع، تعلّم
        عملي، حل مشكلات، ونتائج تتقاس.
      </motion.p>
    </section>
  );
}

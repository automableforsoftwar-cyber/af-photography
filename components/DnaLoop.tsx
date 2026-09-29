"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { dnaSteps, site } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";

const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-50px" } as const;

export function DnaLoop() {
  const [active, setActive] = useState(0);
  const current = dnaSteps[active] ?? dnaSteps[0];

  return (
    <section
      id="dna"
      className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
    >
      <SectionHeader
        kicker="الحمض النووي للأكاديمية"
        title="إزاي بنفكّر… وإزاي بنشتغل."
        description="DNA مش كلام على ورق. دي طريقة الشغل كل يوم: فكّر، حلّل، قرّر، نفّذ، قِس، طوّر، قُد."
      />

      <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, ease }}
          className="relative mx-auto hidden aspect-square w-full max-w-[34rem] md:block"
        >
          <div className="absolute inset-[18%] rounded-full border border-yellow-400/20 bg-white/5 backdrop-blur-md" />
          <div className="absolute inset-[32%] flex flex-col items-center justify-center rounded-full border border-white/10 bg-[#050505] text-center">
            <p className="font-display text-3xl font-bold text-white">AF</p>
            <p className="mt-1 max-w-[9rem] text-[0.7rem] font-medium leading-relaxed text-yellow-400">
              Thinking DNA
            </p>
          </div>

          {dnaSteps.map((step, index) => {
            const angle =
              (-90 + (360 / dnaSteps.length) * index) * (Math.PI / 180);
            const x = 50 + 38 * Math.cos(angle);
            const y = 50 + 38 * Math.sin(angle);
            const selected = index === active;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-full border px-2 py-2 text-center transition-colors duration-200 ${
                  selected
                    ? "border-yellow-400 bg-yellow-400 text-[#050505] shadow-[0_0_28px_rgba(251,191,36,0.45)]"
                    : "border-white/10 bg-[#050505]/90 text-slate-300 hover:border-yellow-400/50"
                }`}
              >
                <span className="text-[0.6rem] font-medium uppercase tracking-wider opacity-80">
                  {step.en}
                </span>
                <span className="text-sm font-bold">{step.ar}</span>
              </button>
            );
          })}
        </motion.div>

        <div className="flex flex-wrap gap-2 md:hidden">
          {dnaSteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActive(index)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                index === active
                  ? "border-yellow-400 bg-yellow-400 text-[#050505]"
                  : "border-white/10 text-slate-400"
              }`}
            >
              {step.ar}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8"
        >
          <p className="text-xs font-medium tracking-wide text-yellow-400">
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(dnaSteps.length).padStart(2, "0")}
          </p>
          <h3 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
            {current.ar} · {current.en}
          </h3>
          <p className="mt-5 max-w-md text-base font-normal leading-relaxed text-slate-400">
            {current.copy}
          </p>
          <p className="mt-8 text-sm font-medium text-yellow-400/90">
            {site.name} — {site.founder}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

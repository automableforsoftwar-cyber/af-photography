"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { modules, type CourseModule } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";

type CourseModulesProps = {
  onEnroll: (module: CourseModule) => void;
};

export function CourseModules({ onEnroll }: CourseModulesProps) {
  return (
    <section
      id="curriculum"
      className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
    >
      <SectionHeader
        kicker="كورسان فقط"
        title="مساران لبناء عين وقرار أوضح."
        description="بداية رحلتك الذكية · إنسان بعين مصور — اشترك عبر الكوميونيتي بكود الاشتراك."
      />

      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        {modules.map((module, index) => (
          <motion.article
            key={module.id}
            className="group relative flex min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-md"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{
              scale: 1.015,
              boxShadow: "0 0 40px rgba(251,191,36,0.12)",
            }}
            transition={{
              duration: 0.55,
              delay: index * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="absolute inset-0">
              <Image
                src={module.image.src}
                alt={module.image.alt}
                fill
                quality={100}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-[#050505]/25" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8">
              <p className="text-xs font-medium text-yellow-400">
                {module.number} · {module.englishTitle}
              </p>
              <h3 className="font-display mt-3 text-balance text-3xl font-bold leading-snug text-white sm:text-4xl">
                {module.title}
              </h3>
              <p className="mt-3 max-w-md text-sm font-normal leading-relaxed text-slate-300">
                {module.description}
              </p>
              <PremiumButton
                className="mt-7 w-fit"
                onClick={() => onEnroll(module)}
              >
                ادخل الكورس
              </PremiumButton>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

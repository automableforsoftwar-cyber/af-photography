"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EnrollmentModal } from "@/components/EnrollmentModal";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useAuthStore } from "@/lib/auth-store";
import { modules, site } from "@/lib/content";
import { getPostAuthPath } from "@/lib/routing";

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease },
  },
};

export function CourseStorefront() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasCourse = useAuthStore((s) => s.hasCourse);
  const setActiveCourseId = useAuthStore((s) => s.setActiveCourseId);
  const [authOpen, setAuthOpen] = useState(false);

  const openCourse = (courseId: string) => {
    if (isLoggedIn && hasCourse(courseId)) {
      setActiveCourseId(courseId);
      router.push(
        `/dashboard/courses?course=${encodeURIComponent(courseId)}`,
      );
      return;
    }
    if (isLoggedIn) {
      router.push("/dashboard");
      return;
    }
    setAuthOpen(true);
  };

  return (
    <div className="relative min-h-svh overflow-x-clip bg-[#050505] px-4 py-16 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -10%, rgba(251,191,36,0.12), transparent 55%)",
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-6xl"
      >
        <motion.header variants={item} className="mb-12 text-center sm:mb-16">
          <p className="text-xs font-medium tracking-[0.18em] text-yellow-400">
            {site.name}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-5xl">
            اختار مسارك
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            اعمل حساب مجاناً — وبعدين فعّل كود الاشتراك الخاص بكل كورس من لوحة
            التعلم. مع {site.founder} ({site.founderEn}).
          </p>
          {!isLoggedIn ? (
            <PremiumButton className="mt-6" onClick={() => setAuthOpen(true)}>
              إنشاء حساب / تسجيل دخول
            </PremiumButton>
          ) : null}
        </motion.header>

        <motion.div variants={container} className="grid gap-6 lg:grid-cols-2">
          {modules.map((course) => {
            const unlocked = isLoggedIn && hasCourse(course.id);
            return (
              <motion.article
                key={course.id}
                variants={item}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 0 40px rgba(251,191,36,0.12)",
                }}
                transition={{ duration: 0.28, ease }}
                className="group relative min-h-[min(56vh,30rem)] overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_28px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl will-change-transform"
              >
                <Image
                  src={course.image.src}
                  alt={course.image.alt}
                  fill
                  quality={100}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-[#050505]/15"
                  aria-hidden="true"
                />
                <div className="relative z-10 flex h-full min-h-[min(56vh,30rem)] flex-col justify-end p-7 sm:p-9">
                  <span className="w-fit rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[0.7rem] font-medium text-yellow-400 backdrop-blur-md">
                    {unlocked ? "مفتوح عندك" : course.duration}
                  </span>
                  <h2 className="mt-4 font-display text-3xl font-bold leading-snug text-white sm:text-4xl">
                    {course.title}
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
                    {course.description}
                  </p>
                  <PremiumButton
                    className="mt-7 w-fit"
                    onClick={() => openCourse(course.id)}
                  >
                    {unlocked
                      ? "ادخل الكورس"
                      : isLoggedIn
                        ? "فعّل كود الكورس"
                        : "نورنا في الكوميونيتي"}
                  </PremiumButton>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </motion.div>

      <EnrollmentModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          router.push(getPostAuthPath(useAuthStore.getState().unlockedCourseIds));
        }}
      />
    </div>
  );
}

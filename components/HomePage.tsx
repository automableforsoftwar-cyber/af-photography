"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CourseModules } from "@/components/CourseModules";
import { DnaLoop } from "@/components/DnaLoop";
import { EnrollmentModal } from "@/components/EnrollmentModal";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { GapSection } from "@/components/GapSection";
import { Hero } from "@/components/Hero";
import { Instructor } from "@/components/Instructor";
import { LearningJourney } from "@/components/LearningJourney";
import { Navbar } from "@/components/Navbar";
import { PublicShowcaseGallery } from "@/components/community/PublicShowcaseGallery";
import { useAuthStore } from "@/lib/auth-store";
import type { CourseModule } from "@/lib/content";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [authOpen, setAuthOpen] = useState(false);
  const [authContext, setAuthContext] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("auth") === "1") {
      setAuthOpen(true);
      setAuthContext("سجّل دخول عشان تكمل.");
    }
  }, [searchParams]);

  const handleEnroll = useCallback(
    (module: CourseModule) => {
      if (!hydrated) return;
      if (!isLoggedIn) {
        setAuthContext(
          `سجّل دخول أو اعمل حساب عشان تدخل «${module.title}». بعد الدخول اختار الكورس تاني من قسم الكورسات.`,
        );
        setAuthOpen(true);
        return;
      }
      router.push(`/dashboard/courses/${encodeURIComponent(module.id)}`);
    },
    [hydrated, isLoggedIn, router],
  );

  return (
    <>
      <div className="film-grain" aria-hidden="true" />
      <Navbar />
      <main id="main" className="bg-[#050505]">
        <Hero />
        <GapSection />
        <DnaLoop />
        <LearningJourney />
        <CourseModules onEnroll={handleEnroll} />
        <Instructor />
        <Gallery />
        <section
          id="public-gallery"
          className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 lg:px-10"
        >
          <PublicShowcaseGallery />
        </section>
      </main>
      <Footer />
      <EnrollmentModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
        }}
        contextLabel={authContext}
        onSuccess={() => {
          // Stay on public homepage after login — no dashboard redirect
          return true;
        }}
      />
    </>
  );
}

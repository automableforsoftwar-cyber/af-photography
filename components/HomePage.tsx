"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
import { useAuthStore } from "@/lib/auth-store";
import type { CourseModule } from "@/lib/content";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function HomePage() {
  const router = useRouter();
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const enrolledCourseId = useAuthStore((state) => state.enrolledCourseId);
  const [enrollingModule, setEnrollingModule] = useState<CourseModule | null>(
    null,
  );

  const closeAuth = useCallback(() => {
    setEnrollingModule(null);
  }, []);

  const goDashboard = useCallback(() => {
    router.push("/course-dashboard");
  }, [router]);

  const handleEnroll = useCallback(
    (module: CourseModule) => {
      if (!hydrated) return;
      if (isLoggedIn && enrolledCourseId === module.id) {
        goDashboard();
        return;
      }
      setEnrollingModule(module);
    },
    [hydrated, isLoggedIn, enrolledCourseId, goDashboard],
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
      </main>
      <Footer />
      <EnrollmentModal
        course={enrollingModule}
        onClose={closeAuth}
        onSuccess={goDashboard}
      />
    </>
  );
}

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
import { PublicPhotoVoting } from "@/components/community/PublicPhotoVoting";
import { useAuthStore } from "@/lib/auth-store";
import type { CourseModule } from "@/lib/content";
import { getPostAuthPath } from "@/lib/routing";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = usePersistHydrated(useAuthStore.persist);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const hasCourse = useAuthStore((state) => state.hasCourse);
  const setActiveCourseId = useAuthStore((state) => state.setActiveCourseId);
  const [authOpen, setAuthOpen] = useState(false);
  const [authContext, setAuthContext] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("auth") === "1") {
      setAuthOpen(true);
      setAuthContext("سجّل دخول عشان تكمل.");
    }
  }, [searchParams]);

  const goAfterAuth = useCallback(() => {
    router.replace(getPostAuthPath(useAuthStore.getState().unlockedCourseIds));
  }, [router]);

  const goDashboard = useCallback(
    (courseId?: string) => {
      if (courseId) {
        setActiveCourseId(courseId);
        router.push(
          `/dashboard/courses?course=${encodeURIComponent(courseId)}`,
        );
        return;
      }
      goAfterAuth();
    },
    [router, setActiveCourseId, goAfterAuth],
  );

  const handleEnroll = useCallback(
    (module: CourseModule) => {
      if (!hydrated) return;
      if (isLoggedIn && hasCourse(module.id)) {
        goDashboard(module.id);
        return;
      }
      if (isLoggedIn) {
        router.push("/dashboard/activate");
        return;
      }
      setAuthContext(
        `اعمل حساب عشان تتابع «${module.title}». فتح الكورس بيحصل بكود الاشتراك من صفحة التفعيل.`,
      );
      setAuthOpen(true);
    },
    [hydrated, isLoggedIn, hasCourse, goDashboard, router],
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
          {/* Exact competition card UI — chronological feed, NO leaderboard */}
          <PublicPhotoVoting variant="public" />
        </section>
      </main>
      <Footer />
      <EnrollmentModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        contextLabel={authContext}
        onSuccess={goAfterAuth}
      />
    </>
  );
}

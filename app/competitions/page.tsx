import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PublicShowcaseGallery } from "@/components/community/PublicShowcaseGallery";

export const metadata: Metadata = {
  title: "المسابقات — AF P",
  description: "صور المسابقات الجارية والتصويت العام.",
};

export default function CompetitionsPage() {
  return (
    <>
      <div className="film-grain" aria-hidden="true" />
      <Navbar />
      <main id="main" className="bg-[#050505] pt-24">
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <PublicShowcaseGallery />
        </section>
      </main>
      <Footer />
    </>
  );
}

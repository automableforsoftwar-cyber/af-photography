import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description:
    "AF P مع أمجد فريد (Amgad Faried): مسار «إنسان بعين مصور» — عين المصور، الإضاءة، والقصة في كل فريم.",
};

export default function Home() {
  return <HomePage />;
}

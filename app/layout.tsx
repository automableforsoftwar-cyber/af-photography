import type { Metadata, Viewport } from "next";
import { Alexandria, Kufam } from "next/font/google";
import { StoreHydration } from "@/components/StoreHydration";
import { site } from "@/lib/content";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#050505",
};

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
  adjustFontFallback: true,
});

const kufam = Kufam({
  subsets: ["arabic", "latin"],
  variable: "--font-kufam",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description:
    "AF P (Amgad Faried Photography) — مسار «إنسان بعين مصور» مع أمجد فريد: صور تروي قصة وتصنع تأثيرًا.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${alexandria.variable} ${kufam.variable} h-full overflow-x-clip antialiased`}
    >
      <body
        className={`${alexandria.className} relative min-h-full overflow-x-clip bg-[#050505] font-sans font-normal leading-relaxed text-slate-400 antialiased`}
      >
        <StoreHydration />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100] focus:bg-af-green focus:px-4 focus:py-2 focus:font-medium focus:text-af-white"
        >
          تخطّي المحتوى
        </a>
        {children}
      </body>
    </html>
  );
}

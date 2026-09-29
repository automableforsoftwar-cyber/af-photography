"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { StudioHeader } from "@/components/StudioHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { enroll, getModuleById } from "@/lib/content";

export function PaymentView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const course = getModuleById(searchParams.get("course"));
  const [processing, setProcessing] = useState(false);

  const completePurchase = () => {
    if (processing) return;
    setProcessing(true);
    window.setTimeout(() => {
      router.push(`/course-dashboard?course=${course.id}`);
    }, 1600);
  };

  return (
    <AuthGate>
      <div className="min-h-svh bg-transparent">
        <StudioHeader eyebrow="الدفع" title="خلّص التسجيل" />
        <main className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="kicker">ملخص الكورس</p>
            <h1 className="font-display text-blend mt-4 text-balance text-4xl font-bold leading-snug sm:text-5xl">
              {course.title}
            </h1>
            <p className="mt-4 max-w-xl font-normal leading-loose text-slate-400">{course.description}</p>

            <div className="relative mt-8 aspect-[16/10] overflow-hidden border border-line">
              <Image
                src={course.image.src}
                alt={course.image.alt}
                fill
                quality={100}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
                priority
              />
            </div>

            <ul className="mt-6 space-y-2 text-sm font-medium text-slate-400">
              <li>
                {course.number} · {course.duration} · {course.lessons} دروس
              </li>
              {course.topics.map((topic) => (
                <li key={topic}>— {topic}</li>
              ))}
            </ul>
          </motion.section>

          <motion.aside
            className="h-fit border border-white/10 bg-white/5 p-7 backdrop-blur-2xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
          >
            <p className="kicker">الدفع</p>
            <p className="mt-3 text-4xl font-bold text-gold">{enroll.price}</p>
            <p className="mt-2 text-sm font-normal leading-loose text-slate-400">
              دفع تجريبي — مفيش بطاقة هتتخصم. لما تخلّص الشراء هتفتح لوحة الكورس.
            </p>

            <dl className="mt-8 space-y-4 border-t border-line pt-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">الوحدة</dt>
                <dd>{course.title}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">الوصول</dt>
                <dd>مفتوح على طول</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">الإجمالي</dt>
                <dd className="text-gold">{enroll.price}</dd>
              </div>
            </dl>

            <PremiumButton
              className="mt-8 w-full"
              onClick={completePurchase}
              disabled={processing}
            >
              {processing ? "بنجهّز…" : "خلّص الشراء"}
            </PremiumButton>
          </motion.aside>
        </main>
      </div>
    </AuthGate>
  );
}

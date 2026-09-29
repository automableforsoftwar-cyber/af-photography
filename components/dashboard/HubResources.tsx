"use client";

import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { resources } from "@/lib/lms";

const ease = [0.22, 1, 0.36, 1] as const;

export function HubResources() {
  return (
    <div>
      <div>
        <p className="kicker">الملحقات</p>
        <h3 className="font-display text-blend mt-2 text-3xl font-bold leading-snug">
          تنزيلات الجلسة
        </h3>
        <p className="mt-3 max-w-2xl text-sm font-normal leading-loose text-slate-400">
          أوراق عمل، نماذج قرار، ودليل مؤشرات — خدهم على شغلك وارجع بالنتيجة للنقد.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {resources.map((resource, index) => (
          <motion.article
            key={resource.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.5, ease }}
            className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6"
          >
            <p className="text-xs font-medium text-gold">{resource.tag}</p>
            <h4 className="mt-3 text-2xl font-bold leading-snug text-slate-200">{resource.title}</h4>
            <p className="mt-2 flex-1 text-sm font-normal leading-loose text-slate-400">
              {resource.copy}
            </p>
            <div className="mt-6 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-400">
                {resource.meta}
              </span>
              <PremiumButton size="sm" variant="glass">
                نزّل
              </PremiumButton>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

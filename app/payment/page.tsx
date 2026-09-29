import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentView } from "@/components/payment/PaymentView";

export const metadata: Metadata = {
  title: "الدفع — AF P",
};

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background text-sm font-medium text-slate-400">
          بنجهّز الدفع…
        </div>
      }
    >
      <PaymentView />
    </Suspense>
  );
}

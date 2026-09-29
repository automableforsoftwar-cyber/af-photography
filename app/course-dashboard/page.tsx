import { redirect } from "next/navigation";

/** Legacy route — middleware also redirects; keep page-level fallback. */
export default function CourseDashboardLegacyPage() {
  redirect("/dashboard");
}

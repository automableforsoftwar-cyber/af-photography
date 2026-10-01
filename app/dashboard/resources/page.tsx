import { redirect } from "next/navigation";

/** الملحقات removed — redirect to courses. */
export default function ResourcesRemovedPage() {
  redirect("/dashboard/courses");
}

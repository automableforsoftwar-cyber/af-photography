import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

/** Alias → dashboard course space (layout for subscribers, black screen if locked). */
export default async function CourseAliasPage({ params }: PageProps) {
  const { courseId } = await params;
  redirect(`/dashboard/courses/${encodeURIComponent(courseId)}`);
}

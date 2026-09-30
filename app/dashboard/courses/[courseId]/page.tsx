import { DashboardShell } from "@/components/dashboard/DashboardShell";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseByIdPage({ params }: PageProps) {
  const { courseId } = await params;
  return <DashboardShell section="course" courseId={courseId} />;
}

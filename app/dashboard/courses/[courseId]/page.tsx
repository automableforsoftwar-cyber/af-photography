import { CourseEntryGate } from "@/components/course/CourseEntryGate";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseByIdPage({ params }: PageProps) {
  const { courseId } = await params;
  return <CourseEntryGate courseId={courseId} />;
}

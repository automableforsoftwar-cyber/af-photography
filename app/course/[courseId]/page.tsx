import { CourseSpace } from "@/components/course/CourseSpace";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePage({ params }: PageProps) {
  const { courseId } = await params;
  return <CourseSpace courseId={courseId} />;
}

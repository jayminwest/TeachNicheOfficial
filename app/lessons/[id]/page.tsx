import { LessonDetail } from "./lesson-detail";

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <LessonDetail id={params.id} />;
}

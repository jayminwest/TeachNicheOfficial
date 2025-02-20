import LessonDetail from "./lesson-detail";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <LessonDetail id={id} />;
}

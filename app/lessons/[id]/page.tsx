import LessonDetail from "./lesson-detail";

export default async function Page({ 
  params,
}: { 
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { id } = params;
  return <LessonDetail id={id} />;
}

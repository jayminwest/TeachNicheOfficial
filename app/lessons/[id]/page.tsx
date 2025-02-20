import LessonDetail from "./lesson-detail";

export default async function Page({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { id } = params;
  return <LessonDetail id={id} />;
}

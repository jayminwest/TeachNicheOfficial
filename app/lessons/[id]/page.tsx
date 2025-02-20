import LessonDetail from "./lesson-detail";

interface PageParams {
  id: string;
}

export default async function Page({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  return <LessonDetail id={id} />;
}

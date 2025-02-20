import LessonDetail from "./lesson-detail";

import { Params } from 'next/dist/shared/lib/router/utils/route-matcher'

export default async function Page({ 
  params 
}: { 
  params: Params & { id: string }
}) {
  const { id } = params;
  return <LessonDetail id={id} />;
}

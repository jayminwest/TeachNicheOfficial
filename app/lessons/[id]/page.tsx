import { Suspense } from "react";
import LessonDetail from "./lesson-detail";
import { Loader2 } from "lucide-react";

export default async function LessonPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { id } = params;
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
          <div className="container max-w-4xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </div>
      }
    >
      <LessonDetail id={id} />
    </Suspense>
  );
}

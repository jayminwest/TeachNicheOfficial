import { Suspense } from "react";
import LessonDetail from "./lesson-detail";
import { Loader2 } from "lucide-react";
import { VideoPlayer } from "@/components/ui/video-player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";

export default function LessonPage({ params }: { params: { id: string } }) {
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
      <LessonDetail params={params} />
    </Suspense>
  );
}

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/app/components/ui/card";
import { LessonCheckout } from "@/app/components/ui/lesson-checkout";
import { LessonPreviewDialog } from "@/app/components/ui/lesson-preview-dialog";

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl: string;
    averageRating: number;
    totalRatings: number;
  };
}

export function LessonCard({ lesson }: LessonCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <Card 
        className="h-full hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsPreviewOpen(true)}
        data-testid="lesson-card"
      >
        <div className="relative aspect-video w-full">
          <Image
            src={lesson.thumbnailUrl || '/placeholder-lesson.jpg'}
            alt={lesson.title}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
        <div className="p-6">
          <h3 className="font-semibold mb-2 line-clamp-2" data-testid="lesson-card-title">
            {lesson.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3" data-testid="lesson-description">
            {lesson.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium" data-testid="lesson-price">
              {lesson.price === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                <span>${lesson.price.toFixed(2)}</span>
              )}
            </div>
            {lesson.price > 0 && (
              <LessonCheckout 
                lessonId={lesson.id} 
                price={Math.round(lesson.price * 100)} // Convert dollars to cents
                searchParams={new URLSearchParams(window.location.search)}
              />
            )}
          </div>
        </div>
      </Card>

      <LessonPreviewDialog
        lesson={lesson}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}

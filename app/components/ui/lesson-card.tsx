import { useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/app/lib/constants";
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
        className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
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
        <div className="p-4 sm:p-6 flex flex-col flex-grow">
          <h3 className="font-semibold mb-2 line-clamp-2 text-sm sm:text-base" data-testid="lesson-card-title">
            {lesson.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-3" data-testid="lesson-description">
            {lesson.description}
          </p>
          <div className="flex items-center justify-between mt-auto">
            {lesson.price > 0 ? (
              <>
                <div className="text-sm font-medium" data-testid="lesson-price">
                  {formatPrice(lesson.price)}
                </div>
                <LessonCheckout 
                  lessonId={lesson.id} 
                  price={Math.round(lesson.price * 100)} // Convert dollars to cents
                  searchParams={new URLSearchParams(window.location.search)}
                />
              </>
            ) : (
              <div className="text-sm font-medium" data-testid="lesson-price">
                <span className="text-green-600">Free</span>
              </div>
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

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/app/components/ui/card";
import { LessonCheckout } from "@/app/components/ui/lesson-checkout";
import { LessonPreviewDialog } from "@/app/components/ui/lesson-preview-dialog";
import { useAuth } from "@/app/services/auth/AuthContext";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { PencilIcon } from "lucide-react";

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl: string;
    averageRating: number;
    totalRatings: number;
    creatorId: string;
  };
}

export function LessonCard({ lesson }: LessonCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  
  // Check if current user is the lesson creator
  const isOwner = user?.id === lesson.creatorId;

  return (
    <>
      <Card 
        className="h-full hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsPreviewOpen(true)}
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
          <h3 className="font-semibold mb-2 line-clamp-2">
            {lesson.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {lesson.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {lesson.price === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                <span>${lesson.price.toFixed(2)}</span>
              )}
            </div>
            
            {/* Show different actions based on ownership */}
            {isOwner ? (
              <Button 
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening preview
                  router.push(`/lessons/${lesson.id}/edit`);
                }}
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              lesson.price > 0 && (
                <LessonCheckout 
                  lessonId={lesson.id} 
                  price={lesson.price}
                  searchParams={new URLSearchParams(window.location.search)}
                />
              )
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

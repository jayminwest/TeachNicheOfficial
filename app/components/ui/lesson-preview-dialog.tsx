import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { StarIcon } from "@radix-ui/react-icons";
import { LessonCheckout } from "@/app/components/ui/lesson-checkout";

interface LessonPreviewDialogProps {
  lesson: {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl: string;
    averageRating: number;
    totalRatings: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function LessonPreviewDialog({ lesson, isOpen, onClose }: LessonPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="lesson-preview-dialog">
        <DialogHeader>
          <DialogTitle data-testid="lesson-title" className="lesson-title">{lesson.title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-lg">
          <Image
            src={lesson.thumbnailUrl || '/placeholder-lesson.jpg'}
            alt={lesson.title}
            fill
            className="object-cover"
            priority
            data-testid="lesson-thumbnail"
          />
        </div>

        {(lesson.averageRating !== undefined && lesson.totalRatings !== undefined) && (
          <div className="flex items-center gap-2 mb-4" data-testid="lesson-rating">
            <div className="flex items-center">
              <StarIcon className="w-5 h-5 text-yellow-400" />
              <span className="ml-1 font-medium">
                {lesson.averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-muted-foreground text-sm">
              ({lesson.totalRatings} ratings)
            </span>
          </div>
        )}

        <DialogDescription className="text-base lesson-description" data-testid="lesson-description">
          {lesson.description}
        </DialogDescription>

        <DialogFooter className="mt-6">
          <div className="w-full flex items-center justify-between">
            <div className="text-lg font-medium lesson-price" data-testid="lesson-price">
              {lesson.price === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                <span>${lesson.price.toFixed(2)}</span>
              )}
            </div>
            {lesson.price > 0 && (
              <LessonCheckout 
                lessonId={lesson.id} 
                price={lesson.price}
                searchParams={new URLSearchParams(window.location.search)}
                data-testid="lesson-checkout"
              />
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

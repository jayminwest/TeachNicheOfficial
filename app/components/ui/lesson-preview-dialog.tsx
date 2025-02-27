import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { StarIcon } from "@radix-ui/react-icons";
import { LessonCheckout } from "@/app/components/ui/lesson-checkout";
import { formatPrice } from "@/app/lib/constants";

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
          <DialogTitle data-testid="preview-lesson-title" className="text-xl font-bold">{lesson.title}</DialogTitle>
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

        <DialogDescription className="text-base" data-testid="preview-lesson-description">
          {lesson.description}
        </DialogDescription>

        <DialogFooter className="mt-6">
          <div className="w-full flex items-center justify-between">
            <div className="text-lg font-medium" data-testid="preview-lesson-price">
              {lesson.price === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatPrice(lesson.price)
              )}
            </div>
            {lesson.price > 0 && (
              <div className="w-full text-right" data-testid="preview-purchase-button">
                <LessonCheckout 
                  lessonId={lesson.id} 
                  price={Math.round(lesson.price * 100)} // Convert dollars to cents
                  searchParams={new URLSearchParams(window.location.search)}
                />
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

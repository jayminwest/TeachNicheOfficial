import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { StarIcon } from "@radix-ui/react-icons";

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{lesson.title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-lg">
          <Image
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="flex items-center gap-2 mb-4">
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

        <DialogDescription className="text-base">
          {lesson.description}
        </DialogDescription>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-lg font-medium">
            {lesson.price === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              <span>${lesson.price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

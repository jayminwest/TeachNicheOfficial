import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { StarIcon } from "@radix-ui/react-icons";
import { LessonCheckout } from "@/app/components/ui/lesson-checkout";
import { useAuth } from "@/app/services/auth/AuthContext";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { PencilIcon, Loader2 } from "lucide-react";
import { useLessonAccess } from '@/app/hooks/use-lesson-access';

interface LessonPreviewDialogProps {
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
  isOpen: boolean;
  onClose: () => void;
}

export function LessonPreviewDialog({ lesson, isOpen, onClose }: LessonPreviewDialogProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Check if current user is the lesson creator
  const isOwner = user?.id === lesson.creatorId;
  
  // Use the lesson access hook to check if user has purchased the lesson
  const { hasAccess, loading: accessLoading } = useLessonAccess(lesson.id);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{lesson.title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-lg">
          <Image
            src={lesson.thumbnailUrl || '/placeholder-lesson.jpg'}
            alt={lesson.title}
            fill
            className="object-cover"
            priority
            unoptimized={!lesson.thumbnailUrl} // Skip optimization for placeholder
          />
        </div>

        {(lesson.averageRating !== undefined && lesson.totalRatings !== undefined) && (
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
        )}

        <DialogDescription className="text-base">
          {lesson.description}
        </DialogDescription>

        <DialogFooter className="mt-6">
          <div className="w-full flex items-center justify-between">
            <div className="text-lg font-medium">
              {lesson.price === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                <span>${lesson.price.toFixed(2)}</span>
              )}
            </div>
            
            {/* Show different actions based on relationship to lesson */}
            {isOwner ? (
              <Button 
                onClick={() => {
                  onClose();
                  router.push(`/lessons/${lesson.id}/edit`);
                }}
                variant="outline"
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit Lesson
              </Button>
            ) : accessLoading ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking access...
              </Button>
            ) : lesson.price > 0 && (
              <LessonCheckout 
                lessonId={lesson.id} 
                price={lesson.price}
                searchParams={new URLSearchParams(window.location.search)}
                hasAccess={hasAccess}
              />
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

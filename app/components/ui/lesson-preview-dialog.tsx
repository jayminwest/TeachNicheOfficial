import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/services/auth/AuthContext";
import { LessonCheckout } from "@/app/components/ui/lesson-checkout";

interface LessonPreviewDialogProps {
  lesson: {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl: string;
    averageRating?: number;
    totalRatings?: number;
    creatorId: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function LessonPreviewDialog({ lesson, isOpen, onClose }: LessonPreviewDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Check if current user is the lesson creator
  const isOwner = user?.id === lesson.creatorId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{lesson.title}</DialogTitle>
          <DialogDescription>
            {lesson.price === 0 ? (
              <span className="text-green-600 font-medium">Free</span>
            ) : (
              <span className="font-medium">${lesson.price.toFixed(2)}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative aspect-video w-full mb-4">
          <Image
            src={lesson.thumbnailUrl || '/placeholder-lesson.jpg'}
            alt={lesson.title}
            fill
            className="object-cover rounded-lg"
            unoptimized={!lesson.thumbnailUrl || 
              (lesson.thumbnailUrl && lesson.thumbnailUrl.startsWith('blob:'))}
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {lesson.description}
          </p>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {isOwner ? (
              <Button onClick={() => {
                onClose();
                router.push(`/lessons/${lesson.id}/edit`);
              }}>
                Edit Lesson
              </Button>
            ) : lesson.price === 0 ? (
              <Button onClick={() => {
                onClose();
                router.push(`/lessons/${lesson.id}`);
              }}>
                Access Free Lesson
              </Button>
            ) : (
              <LessonCheckout 
                lessonId={lesson.id} 
                price={lesson.price}
                searchParams={new URLSearchParams(window.location.search)}
                onAccessLesson={() => {
                  onClose();
                  router.push(`/lessons/${lesson.id}`);
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

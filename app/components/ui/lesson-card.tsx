import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/app/components/ui/card";
import { LessonCheckout } from "@/app/components/ui/lesson-checkout";
import { LessonPreviewDialog } from "@/app/components/ui/lesson-preview-dialog";
import { useAuth } from "@/app/services/auth/AuthContext";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { PencilIcon, Loader2 } from "lucide-react";
import { useLessonAccess } from '@/app/hooks/use-lesson-access';
import { hasSuccessfulPurchaseParams } from '@/app/utils/purchase-helpers';

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
  
  // Use the lesson access hook to check if user has purchased the lesson
  const { hasAccess, loading: accessLoading, purchaseStatus } = useLessonAccess(lesson.id);
  
  // Check if URL indicates a successful purchase
  const [hasPurchaseSuccess, setHasPurchaseSuccess] = useState(false);
  
  useEffect(() => {
    setHasPurchaseSuccess(hasSuccessfulPurchaseParams());
  }, []);
  
  // Determine if user has access to this lesson
  const userHasAccess = hasAccess || hasPurchaseSuccess || purchaseStatus === 'completed';

  return (
    <>
      <Card 
        className="h-full hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsPreviewOpen(true)}
      >
        <div className="relative aspect-video w-full">
          <Image
            src={lesson.thumbnail_url || lesson.thumbnailUrl || '/placeholder-lesson.jpg'}
            alt={lesson.title}
            fill
            className="object-cover rounded-t-lg"
            unoptimized={!(lesson.thumbnail_url || lesson.thumbnailUrl) || 
              (lesson.thumbnail_url && lesson.thumbnail_url.startsWith('blob:')) || 
              (lesson.thumbnailUrl && lesson.thumbnailUrl.startsWith('blob:'))} 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
            
            {/* Show different actions based on relationship to lesson */}
            <div onClick={(e) => e.stopPropagation()}>
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
              ) : accessLoading ? (
                <Button variant="outline" size="sm" disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              ) : userHasAccess || lesson.price === 0 ? (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening preview
                    router.push(`/lessons/${lesson.id}`);
                  }}
                >
                  Access Lesson
                </Button>
              ) : (
                <LessonCheckout 
                  lessonId={lesson.id} 
                  price={lesson.price}
                  searchParams={new URLSearchParams(window.location.search)}
                  hasAccess={userHasAccess}
                  onAccessLesson={() => router.push(`/lessons/${lesson.id}`)}
                />
              )}
            </div>
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

import { useState, useEffect } from "react";
import { LessonCard } from "@/app/components/ui/lesson-card";
import { hasSuccessfulPurchaseParams } from "@/app/utils/purchase-helpers";

interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  created_at: string;
  thumbnailUrl: string;
  averageRating: number;
  totalRatings: number;
}

interface LessonGridProps {
  lessons: Lesson[];
}

export function LessonGrid({ lessons }: LessonGridProps) {
  // Force re-render when URL has purchase success parameters
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  
  useEffect(() => {
    // Check for purchase success parameters and update state
    const hasPurchaseParams = hasSuccessfulPurchaseParams();
    if (hasPurchaseParams) {
      setPurchaseSuccess(true);
    }
  }, []);
  
  // Add a key that changes when purchase success is detected to force re-render
  const gridKey = `lesson-grid-${purchaseSuccess ? 'purchased' : 'normal'}`;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" key={gridKey}>
      {lessons.map((lesson) => (
        <LessonCard key={`${lesson.id}-${purchaseSuccess ? 'purchased' : 'normal'}`} lesson={lesson} />
      ))}
    </div>
  );
}

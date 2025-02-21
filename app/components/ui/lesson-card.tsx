import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LessonCheckout } from "@/components/ui/lesson-checkout";

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description: string;
    price: number;
  };
}

export function LessonCard({ lesson }: LessonCardProps) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <div className="p-6">
        <Link href={`/lessons/${lesson.id}`}>
          <h3 className="font-semibold mb-2 line-clamp-2">
            {lesson.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {lesson.description}
          </p>
        </Link>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
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
            />
          )}
        </div>
      </div>
    </Card>
  );
}

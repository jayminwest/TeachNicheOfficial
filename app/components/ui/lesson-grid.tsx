import { LessonCard } from "@/app/components/ui/lesson-card";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}

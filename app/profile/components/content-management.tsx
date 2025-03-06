import Link from "next/link"
import Image from "next/image"
import { Button } from "@/app/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card"
import { useUserLessons } from "@/app/hooks/use-user-lessons"
import { formatCurrency } from "@/app/utils/format"

export function ContentManagement() {
  const { lessons, loading, error } = useUserLessons({ limit: 5 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Content</h2>
          <p className="text-muted-foreground">Manage your lessons and courses</p>
        </div>
        <Button asChild>
          <Link href="/lessons/new">Create New Lesson</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Lessons</CardTitle>
          <CardDescription>Your recently created or updated lessons</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading your lessons...</p>
            </div>
          ) : error ? (
            <div className="text-red-500">
              Error loading your lessons. Please try again later.
            </div>
          ) : lessons.length === 0 ? (
            <p className="text-muted-foreground">No lessons found. Create your first lesson to get started.</p>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <Link 
                  key={lesson.id} 
                  href={`/lessons/${lesson.id}`}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={lesson.thumbnailUrl}
                      alt={lesson.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-1">{lesson.title}</h3>
                    <p className="text-muted-foreground text-xs line-clamp-1">{lesson.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium">{formatCurrency(lesson.price)}</span>
                      <span className="text-xs text-muted-foreground">
                        {lesson.status === "published" ? "Published" : "Draft"}
                        {lesson.is_featured && " • Featured"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {lessons.length >= 5 && (
                <div className="text-center pt-2">
                  <Button variant="link" asChild>
                    <Link href="/profile/lessons">View all lessons</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View engagement metrics for your content</CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: Implement analytics dashboard */}
          <p className="text-muted-foreground">Analytics coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}

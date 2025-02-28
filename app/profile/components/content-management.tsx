import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card"
import { useAuth } from "@/app/services/auth/AuthContext"
import { canCreateLesson } from "@/app/services/user-restrictions"
import { LessonCreationRestriction } from "@/app/components/ui/lesson-creation-restriction"

export function ContentManagement() {
  const { user } = useAuth();
  const canCreate = user?.metadata?.creationTime 
    ? canCreateLesson(user.metadata.creationTime) 
    : false;
    
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Content</h2>
          <p className="text-muted-foreground">Manage your lessons and courses</p>
        </div>
        <Button asChild disabled={!canCreate}>
          <Link href="/lessons/new">Create New Lesson</Link>
        </Button>
      </div>
      
      {!canCreate && (
        <LessonCreationRestriction className="mb-4" />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Lessons</CardTitle>
          <CardDescription>Your recently created or updated lessons</CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: Implement lessons grid/list */}
          <p className="text-muted-foreground">No lessons found. Create your first lesson to get started.</p>
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

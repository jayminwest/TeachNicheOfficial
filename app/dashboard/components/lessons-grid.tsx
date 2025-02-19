import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, ThumbsUp, Clock } from "lucide-react"

const lessons = [
  {
    id: "1",
    title: "Introduction to Kendama",
    thumbnail: "/placeholder.jpg",
    views: 1234,
    likes: 89,
    duration: "45min",
    status: "published"
  },
  {
    id: "2",
    title: "Advanced Tricks Masterclass",
    thumbnail: "/placeholder.jpg",
    views: 892,
    likes: 76,
    duration: "1h 15min",
    status: "published"
  },
  {
    id: "3",
    title: "Beginner's Guide",
    thumbnail: "/placeholder.jpg",
    views: 567,
    likes: 45,
    duration: "30min",
    status: "draft"
  },
  {
    id: "4",
    title: "Pro Tips & Techniques",
    thumbnail: "/placeholder.jpg",
    views: 321,
    likes: 28,
    duration: "55min",
    status: "published"
  },
]

export default function LessonsGrid() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Lessons</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Lessons</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardContent className="p-4">
                    <div className="aspect-video bg-muted mb-4 rounded-lg overflow-hidden">
                      {/* Placeholder for video thumbnail */}
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">Thumbnail</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {lesson.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {lesson.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" className="w-full">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="published">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.filter(l => l.status === "published").map((lesson) => (
                <Card key={lesson.id}>
                  <CardContent className="p-4">
                    <div className="aspect-video bg-muted mb-4 rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">Thumbnail</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {lesson.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {lesson.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" className="w-full">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="drafts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.filter(l => l.status === "draft").map((lesson) => (
                <Card key={lesson.id}>
                  <CardContent className="p-4">
                    <div className="aspect-video bg-muted mb-4 rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">Thumbnail</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {lesson.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {lesson.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" className="w-full">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

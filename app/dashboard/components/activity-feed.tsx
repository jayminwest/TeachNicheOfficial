import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Users, PlayCircle, CreditCard } from "lucide-react"

const activities = [
  {
    icon: PlayCircle,
    title: "Started watching Introduction to Kendama",
    time: "2 minutes ago",
    type: "watch"
  },
  {
    icon: CreditCard,
    title: "Purchased Advanced Tricks Course",
    time: "1 hour ago",
    type: "purchase"
  },
  {
    icon: Users,
    title: "New student enrolled in your course",
    time: "3 hours ago",
    type: "enrollment"
  },
  {
    icon: Clock,
    title: "Completed Basic Techniques",
    time: "1 day ago",
    type: "completion"
  },
]

export default function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
          >
            <div className="rounded-full bg-muted p-2">
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {activity.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target, Users, Clock } from "lucide-react"

const goals = [
  {
    title: "Monthly Revenue Target",
    current: 1234,
    target: 2000,
    icon: Trophy,
    progress: (1234 / 2000) * 100,
    metric: "$",
    status: "On track to exceed goal"
  },
  {
    title: "New Students Goal",
    current: 45,
    target: 50,
    icon: Users,
    progress: (45 / 50) * 100,
    metric: "",
    status: "5 more students to reach goal"
  },
  {
    title: "Content Creation",
    current: 8,
    target: 10,
    icon: Target,
    progress: (8 / 10) * 100,
    metric: "",
    status: "2 more lessons to reach goal"
  },
  {
    title: "Teaching Hours",
    current: 22,
    target: 30,
    icon: Clock,
    progress: (22 / 30) * 100,
    metric: "",
    status: "8 hours remaining this month"
  }
]

export default function GoalsProgress() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map((goal) => (
            <Card key={goal.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <goal.icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">{goal.title}</h3>
                  </div>
                  <span className="text-sm font-medium">
                    {goal.metric}{goal.current}/{goal.metric}{goal.target}
                  </span>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {goal.status}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

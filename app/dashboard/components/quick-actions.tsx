import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, BookOpen, Settings, BarChart } from "lucide-react"

const actions = [
  {
    title: "Create Lesson",
    icon: PlusCircle,
    href: "/lessons/new",
    variant: "default" as const
  },
  {
    title: "My Lessons",
    icon: BookOpen,
    href: "/lessons",
    variant: "secondary" as const
  },
  {
    title: "Analytics",
    icon: BarChart,
    href: "#",
    variant: "secondary" as const
  },
  {
    title: "Settings",
    icon: Settings,
    href: "#",
    variant: "secondary" as const
  },
]

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant={action.variant}
            className="flex flex-col h-24 items-center justify-center space-y-2"
            asChild
          >
            <a href={action.href}>
              <action.icon className="h-6 w-6" />
              <span>{action.title}</span>
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

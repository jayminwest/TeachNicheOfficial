import { Card, CardContent } from "@/app/components/ui/card"
import { cn } from "@/lib/utils"

const stats = [
  { label: "Total Earnings", value: "$1,234", change: "+12%" },
  { label: "Active Lessons", value: "23", change: "+3" },
  { label: "Watch Time", value: "156h", change: "+22%" },
  { label: "Students", value: "89", change: "+15%" },
]

export default function DashboardHeader() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your lessons.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">{stat.label}</p>
                <span className={cn(
                  "text-sm",
                  stat.change.startsWith("+") ? "text-green-500" : "text-red-500"
                )}>
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

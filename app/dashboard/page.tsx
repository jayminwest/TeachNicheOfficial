import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import DashboardHeader from "./components/dashboard-header"
import ActivityFeed from "./components/activity-feed"
import PerformanceMetrics from "./components/performance-metrics"
import LessonsGrid from "./components/lessons-grid"
import AnalyticsSection from "./components/analytics-section"
import EarningsWidget from "./components/earnings-widget"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <DashboardHeader />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <div>
              <EarningsWidget />
              <div className="mt-2 text-center">
                <Link 
                  href="/dashboard/earnings" 
                  className="text-sm text-primary hover:underline"
                >
                  View detailed earnings & payouts
                </Link>
              </div>
            </div>
            <ActivityFeed />
            <PerformanceMetrics />
          </div>

          <div className="mt-6">
            <AnalyticsSection />
          </div>

          <div className="mt-6">
            <LessonsGrid />
          </div>
          
        </Suspense>
      </div>
    </div>
  )
}

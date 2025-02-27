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
                  className="text-sm font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-1 p-2 rounded-md border border-primary/20 transition-colors"
                  data-testid="earnings-dashboard-link"
                  aria-label="View your detailed earnings and payout history"
                >
                  <span>View detailed earnings & payouts</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right">
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
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

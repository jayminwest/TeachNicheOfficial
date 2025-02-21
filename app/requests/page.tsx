import { Suspense } from 'react'
import { RequestDialog } from './components/request-dialog'
import { RequestGrid } from './components/request-grid'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Lesson Requests - Teach Niche',
  description: 'Request and vote on new lessons you would like to see on Teach Niche',
}

export default function RequestsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Lesson Requests</h1>
          <p className="text-muted-foreground mt-2">
            Vote on existing requests or create your own to help shape our content
          </p>
        </div>
        <RequestDialog onRequestCreated={() => {}} />
      </div>
      
      <Suspense 
        fallback={
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }
      >
        <RequestGrid />
      </Suspense>
    </div>
  )
}

import { Suspense } from 'react'
import { RequestForm } from './components/request-form'
import { RequestGrid } from './components/request-grid'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Lesson Requests - Teach Niche',
  description: 'Request and vote on new lessons you would like to see on Teach Niche',
}

export default function RequestsPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">Lesson Requests</h1>
        <p className="text-muted-foreground mb-8">
          Request new lessons or vote on existing requests to help us prioritize content creation.
        </p>
        <RequestForm />
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

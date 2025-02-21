'use client'

import { RequestDialog } from './components/request-dialog'
import { RequestGrid } from './components/request-grid'

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
        <RequestDialog />
      </div>
      <RequestGrid />
    </div>
  )
}

export const metadata = {
  title: 'Lesson Requests - Teach Niche',
  description: 'Request and vote on new lessons you would like to see on Teach Niche',
}

import { Suspense } from 'react'
import NotFoundContent from '@/app/components/not-found-content'

export default function NotFoundPage() {
  return (
    <Suspense fallback={
      <div className="container flex flex-col items-center justify-center min-h-[70vh] py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
        <p>Loading...</p>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  )
}

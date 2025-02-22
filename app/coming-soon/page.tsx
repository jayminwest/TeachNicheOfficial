import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { SearchParams } from "next/navigation"

export default function ComingSoonPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Coming Soon
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          This page is still under construction. Check back at launch!
        </p>
        {searchParams.from && (
          <p className="mt-2 text-sm text-muted-foreground">
            Requested path: {searchParams.from}
          </p>
        )}
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}

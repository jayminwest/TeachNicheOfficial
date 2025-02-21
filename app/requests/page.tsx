'use client'

import { RequestGrid } from './components/request-grid'
import { RequestSidebar } from './components/request-sidebar'
import { Button } from '@/app/components/ui/button'
import { useState } from 'react'
import { Menu } from 'lucide-react'

export default function RequestsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>()
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen pt-16">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex">
        <RequestSidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Toggle sidebar"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold">
                  {selectedCategory || 'All'} Lesson Requests
                </h1>
                <p className="text-muted-foreground mt-2">
                  Browse and vote on lesson requests or create your own
                </p>
              </div>
            </div>
            <RequestGrid 
              category={selectedCategory}
              sortBy={sortBy}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { Button } from '@/app/components/ui/button'
import { LESSON_CATEGORIES } from '@/app/lib/schemas/lesson-request'
import { RequestDialog } from './request-dialog'
import { Plus, X } from 'lucide-react'
import { cn } from '@/app/lib/utils'

interface RequestSidebarProps {
  selectedCategory?: string
  onSelectCategory: (category?: string) => void
  sortBy: 'popular' | 'newest'
  onSortChange: (sort: 'popular' | 'newest') => void
  isOpen: boolean
  onClose: () => void
}

export function RequestSidebar({ 
  selectedCategory, 
  onSelectCategory,
  sortBy,
  onSortChange,
  isOpen,
  onClose
}: RequestSidebarProps) {
  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-30 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center lg:hidden">
          <h2 className="font-semibold">Filter & Sort</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sort Options */}
        <div>
          <h3 className="font-semibold mb-3">Sort By</h3>
          <div className="space-y-1">
            <Button
              variant={sortBy === 'popular' ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                onSortChange('popular')
                onClose()
              }}
            >
              Most Popular
            </Button>
            <Button
              variant={sortBy === 'newest' ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                onSortChange('newest')
                onClose()
              }}
            >
              Newest First
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-semibold mb-3">Categories</h3>
          <div className="space-y-1">
            <Button
              variant={!selectedCategory ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                onSelectCategory(undefined)
                onClose()
              }}
            >
              All Requests
            </Button>
            {LESSON_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  onSelectCategory(category)
                  onClose()
                }}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <RequestDialog>
            <Button className="w-full" size="lg">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </RequestDialog>
        </div>
      </div>
    </div>
  )
}

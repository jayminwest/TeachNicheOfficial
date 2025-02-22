'use client'

import { RequestGrid } from './components/request-grid'
import { RequestSidebar } from './components/request-sidebar'
import { Button } from '@/app/components/ui/button'
import { useState } from 'react'
import { Menu, Plus } from 'lucide-react'
import { AuthDialog } from '@/app/components/ui/auth-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { useAuth } from '@/app/services/auth/AuthContext'

export default function RequestsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>()
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const { user } = useAuth()

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
                <Button 
                  data-testid="new-request-button"
                  variant="default"
                  size="lg"
                  className="mt-4"
                  onClick={() => {
                    if (user) {
                      setShowRequestDialog(true)
                    } else {
                      setShowAuthDialog(true)
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>

                {/* Auth Dialog */}
                <AuthDialog
                  open={showAuthDialog}
                  onOpenChange={setShowAuthDialog}
                  defaultView="sign-in"
                />

                {/* Request Dialog */}
                <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Lesson Request</DialogTitle>
                    </DialogHeader>
                    {/* Request form will go here */}
                  </DialogContent>
                </Dialog>
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

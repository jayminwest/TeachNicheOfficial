// Static page with no client components to avoid useSearchParams() error
export const dynamic = 'force-static';

export default function RequestsPage() {
  return (
    <div className="min-h-screen pt-16">
      <div className="flex">
        {/* Static sidebar placeholder */}
        <div className="hidden lg:block w-64 shrink-0 border-r h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto p-4">
          <h3 className="font-semibold mb-2">Categories</h3>
          <div className="space-y-1 mb-6">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
          </div>
          
          <h3 className="font-semibold mb-2">Sort By</h3>
          <div className="space-y-1">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        <div className="flex-1">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <button 
                className="lg:hidden inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 bg-background"
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              </button>
              <div>
                <h1 className="text-4xl font-bold">
                  All Lesson Requests
                </h1>
                <p className="text-muted-foreground mt-2">
                  Browse and vote on lesson requests or create your own
                </p>

                <button 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-4"
                  data-testid="create-request-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  New Request
                </button>
              </div>
            </div>
            
            {/* Request grid placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-lg border shadow-sm p-4">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full mb-1"></div>
                  <div className="h-4 bg-muted rounded w-5/6 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-8 bg-muted rounded w-20"></div>
                    <div className="h-8 bg-muted rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <noscript>
        <div className="p-8">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to view and interact with lesson requests. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
      
      <script dangerouslySetInnerHTML={{ 
        __html: `
          // Load the actual requests content after page loads
          document.addEventListener('DOMContentLoaded', function() {
            const script = document.createElement('script');
            script.src = '/requests-client.js';
            script.async = true;
            document.body.appendChild(script);
          });
        `
      }} />
    </div>
  );
}

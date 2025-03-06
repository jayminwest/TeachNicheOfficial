// Static page component that doesn't use any client hooks
export default function RequestsPage() {
  return (
    <div className="min-h-screen pt-16">
      <div className="container p-8 space-y-6">
        <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded-md"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[120px] w-full bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
      
      {/* Client-side only script to load requests component */}
      <div id="requests-container">
        {/* Loading state will be replaced by client script */}
      </div>
      
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // Create and render the requests client component
                const container = document.getElementById('requests-container');
                if (container) {
                  // Import the client component dynamically
                  import('/requests-client-bundle.js')
                    .then(() => {
                      console.log('Requests client script loaded');
                    })
                    .catch(err => {
                      console.error('Error loading requests client:', err);
                      container.innerHTML = '<div class="container p-8"><div class="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md"><h3 class="font-bold">Error Loading Requests</h3><p>Please refresh the page to try again.</p></div></div>';
                    });
                }
              } catch (err) {
                console.error('Error initializing requests client:', err);
              }
            })();
          `
        }}
      />
      
      <noscript>
        <div className="p-8">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to view and interact with lesson requests. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
    </div>
  );
}

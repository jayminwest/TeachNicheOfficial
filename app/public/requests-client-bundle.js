// This is a simplified client-side only script to render the requests component
(function() {
  console.log('Requests client bundle initializing');
  
  // Create the requests component container
  const container = document.getElementById('requests-container');
  if (!container) {
    console.error('Requests container not found');
    return;
  }
  
  try {
    // Parse URL parameters
    const url = new URL(window.location.href);
    const category = url.searchParams.get('category') || '';
    const sortBy = url.searchParams.get('sort') || 'recent';
    
    // Create a simple requests component
    const requestsComponent = document.createElement('div');
    requestsComponent.className = 'container p-8';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'mb-8';
    header.innerHTML = `
      <h1 class="text-4xl font-bold">All Lesson Requests</h1>
      <p class="text-muted-foreground mt-2">Browse and vote on lesson requests or create your own</p>
      <button class="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        New Request
      </button>
    `;
    
    // Create requests grid
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    
    // Fetch requests data
    fetch('/api/requests')
      .then(response => response.json())
      .then(requests => {
        if (requests && requests.length > 0) {
          requests.forEach(request => {
            const requestCard = document.createElement('div');
            requestCard.className = 'bg-card rounded-lg border shadow-sm p-4';
            requestCard.innerHTML = `
              <h3 class="font-semibold mb-2">${request.title}</h3>
              <p class="text-sm text-muted-foreground mb-4">${request.description}</p>
              <div class="flex justify-between items-center">
                <span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  ${request.category}
                </span>
                <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3">
                  Vote (${request.votes})
                </button>
              </div>
            `;
            grid.appendChild(requestCard);
          });
        } else {
          grid.innerHTML = `
            <div class="col-span-full text-center py-12">
              <p class="text-muted-foreground mb-4">No requests found</p>
              <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
                Create the first request
              </button>
            </div>
          `;
        }
      })
      .catch(error => {
        console.error('Error fetching requests:', error);
        grid.innerHTML = `
          <div class="col-span-full p-6 bg-destructive/10 rounded-lg flex flex-col items-center justify-center">
            <p class="text-lg font-medium">Something went wrong loading requests</p>
            <p class="text-muted-foreground mb-4">Please try refreshing the page</p>
          </div>
        `;
      });
    
    // Add components to the page
    requestsComponent.appendChild(header);
    requestsComponent.appendChild(grid);
    
    // Replace the container content with our component
    container.innerHTML = '';
    container.appendChild(requestsComponent);
    
    console.log('Requests client bundle initialized successfully');
  } catch (err) {
    console.error('Error initializing requests client bundle:', err);
    container.innerHTML = '<div class="container p-8"><div class="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md"><h3 class="font-bold">Error</h3><p>There was a problem loading the requests page. Please refresh to try again.</p></div></div>';
  }
})();

// This script will be loaded client-side only
(function() {
  // State
  let selectedCategory = null;
  let sortBy = 'popular';
  let isSidebarOpen = false;
  let requests = [];
  let error = null;

  // Fetch requests from the API
  async function fetchRequests() {
    try {
      const url = new URL('/api/requests', window.location.origin);
      
      if (selectedCategory) {
        url.searchParams.append('category', selectedCategory);
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await response.json();
      requests = data;
      
      // Sort requests
      if (sortBy === 'popular') {
        requests.sort((a, b) => b.vote_count - a.vote_count);
      } else {
        requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      
      renderRequests();
    } catch (err) {
      console.error('Error fetching requests:', err);
      showError(err.message || 'Failed to load requests');
    }
  }

  // Show error message
  function showError(message) {
    error = message;
    
    // Create or update error alert
    let alertEl = document.querySelector('.error-alert');
    if (!alertEl) {
      alertEl = document.createElement('div');
      alertEl.className = 'error-alert mb-6 bg-destructive/15 text-destructive px-4 py-3 rounded-md flex items-center';
      
      const mainContent = document.querySelector('.flex-1 > div');
      const requestsGrid = document.querySelector('.grid');
      
      if (mainContent && requestsGrid) {
        mainContent.insertBefore(alertEl, requestsGrid);
      }
    }
    
    alertEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <span class="ml-2">${message}</span>
    `;
  }

  // Render the sidebar
  function renderSidebar() {
    const sidebarContainer = document.querySelector('.hidden.lg\\:block');
    if (!sidebarContainer) return;
    
    const categories = [
      { id: null, name: 'All Requests' },
      { id: 'beginner', name: 'Beginner' },
      { id: 'intermediate', name: 'Intermediate' },
      { id: 'advanced', name: 'Advanced' },
      { id: 'expert', name: 'Expert' },
      { id: 'other', name: 'Other' }
    ];
    
    sidebarContainer.innerHTML = `
      <h3 class="font-semibold mb-2">Categories</h3>
      <div class="space-y-1 mb-6">
        ${categories.map(category => `
          <button 
            class="w-full flex items-center px-3 py-2 text-sm rounded-md ${selectedCategory === category.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}"
            data-category="${category.id || ''}"
          >
            ${category.name}
          </button>
        `).join('')}
      </div>
      
      <h3 class="font-semibold mb-2">Sort By</h3>
      <div class="space-y-1">
        <button 
          class="w-full flex items-center px-3 py-2 text-sm rounded-md ${sortBy === 'popular' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}"
          data-sort="popular"
        >
          Most Popular
        </button>
        <button 
          class="w-full flex items-center px-3 py-2 text-sm rounded-md ${sortBy === 'newest' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}"
          data-sort="newest"
        >
          Newest First
        </button>
      </div>
    `;
    
    // Add event listeners to category buttons
    sidebarContainer.querySelectorAll('[data-category]').forEach(button => {
      button.addEventListener('click', () => {
        selectedCategory = button.dataset.category || null;
        updateTitle();
        fetchRequests();
      });
    });
    
    // Add event listeners to sort buttons
    sidebarContainer.querySelectorAll('[data-sort]').forEach(button => {
      button.addEventListener('click', () => {
        sortBy = button.dataset.sort;
        fetchRequests();
      });
    });
  }

  // Update the title based on selected category
  function updateTitle() {
    const titleEl = document.querySelector('h1');
    if (titleEl) {
      let categoryName = 'All';
      
      if (selectedCategory) {
        // Capitalize first letter
        categoryName = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
      }
      
      titleEl.textContent = `${categoryName} Lesson Requests`;
    }
  }

  // Render the requests grid
  function renderRequests() {
    const gridContainer = document.querySelector('.grid');
    if (!gridContainer) return;
    
    if (requests.length === 0) {
      gridContainer.innerHTML = `
        <div class="col-span-full text-center p-8">
          <h3 class="text-lg font-semibold mb-2">No requests found</h3>
          <p class="text-muted-foreground mb-4">Be the first to create a request for this category</p>
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Request
          </button>
        </div>
      `;
      return;
    }
    
    gridContainer.innerHTML = requests.map(request => `
      <div class="bg-card rounded-lg border shadow-sm p-4">
        <h3 class="font-semibold text-lg mb-1">${request.title}</h3>
        <p class="text-muted-foreground text-sm mb-4">${request.description}</p>
        <div class="flex justify-between items-center">
          <span class="text-sm bg-accent/50 px-2 py-1 rounded">${request.category}</span>
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2" data-request-id="${request.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1 h-4 w-4"><path d="m6 9 6 6 6-6"></path></svg>
            Vote (${request.vote_count})
          </button>
        </div>
      </div>
    `).join('');
    
    // Add event listeners to vote buttons
    gridContainer.querySelectorAll('[data-request-id]').forEach(button => {
      button.addEventListener('click', async () => {
        try {
          const requestId = button.dataset.requestId;
          
          const response = await fetch('/api/requests/vote', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requestId,
              voteType: 'upvote'
            }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            if (data.error === 'unauthenticated') {
              // Redirect to auth page
              window.location.href = '/auth?redirect=/requests';
              return;
            }
            
            throw new Error(data.error || 'Failed to vote');
          }
          
          // Update the vote count in our local data
          const request = requests.find(r => r.id === requestId);
          if (request) {
            request.vote_count = data.currentVotes;
            renderRequests();
          }
        } catch (err) {
          console.error('Error voting:', err);
          showError(err.message || 'Failed to vote');
        }
      });
    });
  }

  // Setup mobile sidebar toggle
  function setupMobileSidebar() {
    const toggleButton = document.querySelector('.lg\\:hidden');
    if (!toggleButton) return;
    
    toggleButton.addEventListener('click', () => {
      isSidebarOpen = !isSidebarOpen;
      
      // Create or remove overlay
      let overlay = document.querySelector('.fixed.inset-0');
      
      if (isSidebarOpen) {
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'fixed inset-0 bg-black/20 z-20 lg:hidden';
          document.body.appendChild(overlay);
          
          overlay.addEventListener('click', () => {
            isSidebarOpen = false;
            document.body.removeChild(overlay);
            
            // Hide mobile sidebar
            const mobileSidebar = document.querySelector('.mobile-sidebar');
            if (mobileSidebar) {
              document.body.removeChild(mobileSidebar);
            }
          });
        }
        
        // Create mobile sidebar
        const mobileSidebar = document.createElement('div');
        mobileSidebar.className = 'mobile-sidebar fixed inset-y-0 left-0 w-64 bg-background border-r p-4 z-30 lg:hidden';
        
        // Clone sidebar content
        const sidebarContent = document.querySelector('.hidden.lg\\:block');
        if (sidebarContent) {
          mobileSidebar.innerHTML = sidebarContent.innerHTML;
        }
        
        document.body.appendChild(mobileSidebar);
        
        // Add event listeners to category buttons
        mobileSidebar.querySelectorAll('[data-category]').forEach(button => {
          button.addEventListener('click', () => {
            selectedCategory = button.dataset.category || null;
            updateTitle();
            fetchRequests();
            
            // Close sidebar
            isSidebarOpen = false;
            document.body.removeChild(overlay);
            document.body.removeChild(mobileSidebar);
          });
        });
        
        // Add event listeners to sort buttons
        mobileSidebar.querySelectorAll('[data-sort]').forEach(button => {
          button.addEventListener('click', () => {
            sortBy = button.dataset.sort;
            fetchRequests();
            
            // Close sidebar
            isSidebarOpen = false;
            document.body.removeChild(overlay);
            document.body.removeChild(mobileSidebar);
          });
        });
      } else if (overlay) {
        document.body.removeChild(overlay);
        
        // Hide mobile sidebar
        const mobileSidebar = document.querySelector('.mobile-sidebar');
        if (mobileSidebar) {
          document.body.removeChild(mobileSidebar);
        }
      }
    });
  }

  // Setup new request button
  function setupNewRequestButton() {
    const newRequestButton = document.querySelector('[data-testid="create-request-button"]');
    if (!newRequestButton) return;
    
    newRequestButton.addEventListener('click', () => {
      // Redirect to auth page with redirect back to requests
      window.location.href = '/auth?redirect=/requests/new';
    });
  }

  // Initialize the page
  function init() {
    renderSidebar();
    setupMobileSidebar();
    setupNewRequestButton();
    fetchRequests();
  }
  
  // Run initialization
  init();
})();

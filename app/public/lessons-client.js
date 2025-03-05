// This script will be loaded client-side only
(function() {
  async function fetchLessons() {
    try {
      const response = await fetch('/api/lessons');
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching lessons:', error);
      showError(error.message || 'Failed to load lessons. Please try again.');
      return { lessons: [] };
    }
  }

  function showError(message) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    toastContainer.style.maxWidth = '420px';
    
    const toast = document.createElement('div');
    toast.className = 'bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg flex items-start gap-2';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <div>
        <h4 class="font-medium">Error</h4>
        <p class="text-sm">${message}</p>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(toastContainer);
      }, 300);
    }, 5000);
  }

  function showSuccessToast(title, message) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    toastContainer.style.maxWidth = '420px';
    
    const toast = document.createElement('div');
    toast.className = 'bg-background text-foreground border p-4 rounded-md shadow-lg flex items-start gap-2';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 shrink-0 text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <div>
        <h4 class="font-medium">${title}</h4>
        <p class="text-sm">${message}</p>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(toastContainer);
      }, 300);
    }, 5000);
  }

  function checkPurchaseParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const lessonId = urlParams.get('lessonId');
    
    if (status === 'success' && lessonId) {
      showSuccessToast(
        'Purchase Successful',
        'Your lesson purchase was successful. You now have access to this content.'
      );
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }

  function renderLessons(lessons) {
    const container = document.querySelector('.container');
    if (!container) return;
    
    const contentContainer = container.querySelector('.animate-pulse');
    if (!contentContainer) return;
    
    if (lessons.length === 0) {
      contentContainer.innerHTML = `
        <div class="bg-card text-card-foreground rounded-lg border shadow-sm p-8 text-center">
          <h3 class="font-semibold mb-2">No lessons yet</h3>
          <p class="text-muted-foreground mb-4">
            Get started by creating your first lesson
          </p>
          <a href="/lessons/new" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Lesson
          </a>
        </div>
      `;
    } else {
      // Create grid layout
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
      
      // Add lesson cards
      lessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'bg-card text-card-foreground rounded-lg border shadow-sm overflow-hidden';
        
        card.innerHTML = `
          <div class="relative aspect-video">
            <img 
              src="${lesson.thumbnailUrl || '/placeholder-lesson.jpg'}" 
              alt="${lesson.title}" 
              class="object-cover w-full h-full"
            />
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-lg mb-1">${lesson.title}</h3>
            <p class="text-muted-foreground text-sm line-clamp-2 mb-3">${lesson.description}</p>
            <div class="flex justify-between items-center">
              <span class="font-medium">${lesson.price > 0 ? '$' + lesson.price.toFixed(2) : 'Free'}</span>
              <a href="/lessons/${lesson.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
                View Lesson
              </a>
            </div>
          </div>
        `;
        
        grid.appendChild(card);
      });
      
      contentContainer.innerHTML = '';
      contentContainer.appendChild(grid);
    }
  }

  async function init() {
    // Check for purchase success parameters
    checkPurchaseParams();
    
    // Fetch and render lessons
    const { lessons } = await fetchLessons();
    renderLessons(lessons);
  }
  
  // Initialize the page
  init();
})();

(function() {
  // State
  let lessons = [];
  let loading = true;
  let error = null;
  
  // Fetch lessons from the API
  async function fetchLessons() {
    try {
      // Get filter parameters from URL if needed
      const urlParams = new URLSearchParams(window.location.search);
      const category = urlParams.get('category');
      
      // Build the API URL with any filters
      let apiUrl = '/api/lessons';
      if (category) {
        apiUrl += `?category=${encodeURIComponent(category)}`;
      }
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }
      
      const data = await response.json();
      return data.lessons || [];
    } catch (err) {
      console.error('Error fetching lessons:', err);
      showError(err.message || 'Failed to load lessons. Please try again later.');
      return [];
    }
  }
  
  // Show error message
  function showError(message) {
    error = message;
    
    const container = document.querySelector('.container');
    if (!container) return;
    
    const loadingEl = container.querySelector('.animate-pulse');
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div class="p-4 bg-red-100 text-red-800 rounded-md">
          ${message}
        </div>
      `;
    }
  }
  
  // Render lessons grid
  function renderLessons(lessons) {
    const container = document.querySelector('.container');
    if (!container) return;
    
    const loadingEl = container.querySelector('.animate-pulse');
    if (!loadingEl) return;
    
    if (lessons.length === 0) {
      loadingEl.innerHTML = `
        <div class="text-center py-12">
          <p class="text-lg text-muted-foreground">No lessons found.</p>
          <p class="mt-2">
            <a href="/lessons/new" class="text-primary hover:underline">Create your first lesson</a>
          </p>
        </div>
      `;
      return;
    }
    
    // Create the lessons grid
    let lessonsHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;
    
    // Add each lesson card
    lessons.forEach(lesson => {
      const thumbnailHtml = lesson.thumbnailUrl 
        ? `<img src="${lesson.thumbnailUrl}" alt="${lesson.title}" class="object-cover w-full h-full">`
        : `<div class="flex items-center justify-center h-full bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-12 w-12 text-muted-foreground/50"><path d="M15 8h.01"></path><rect width="16" height="16" x="4" y="4" rx="3"></rect><path d="M4 15l4-4a3 5 0 0 1 3 0l5 5"></path><path d="M14 14l1-1a3 5 0 0 1 3 0l2 2"></path></svg>
          </div>`;
      
      lessonsHtml += `
        <div class="bg-card rounded-lg shadow-sm border overflow-hidden">
          <div class="aspect-video bg-muted relative">
            ${thumbnailHtml}
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-lg mb-1 truncate">${lesson.title}</h3>
            <p class="text-muted-foreground text-sm line-clamp-2 mb-3">${lesson.description}</p>
            <div class="flex justify-between items-center">
              <span class="font-medium">$${lesson.price.toFixed(2)}</span>
              <a href="/lessons/${lesson.id}" class="text-primary hover:underline text-sm">
                View Details
              </a>
            </div>
          </div>
        </div>
      `;
    });
    
    lessonsHtml += `</div>`;
    
    // Replace loading element with lessons grid
    loadingEl.innerHTML = lessonsHtml;
  }
  
  // Initialize the page
  async function init() {
    // Check for purchase success parameters
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const lessonId = urlParams.get('lessonId');
    
    if (status === 'success' && lessonId) {
      // Show success toast
      const toastContainer = document.createElement('div');
      toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
      toastContainer.style.maxWidth = '420px';
      
      const toast = document.createElement('div');
      toast.className = 'bg-background text-foreground border p-4 rounded-md shadow-lg flex items-start gap-3';
      toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <div>
          <h3 class="font-medium">Purchase Successful</h3>
          <p class="text-sm text-muted-foreground">Your lesson purchase was successful. You now have access to this content.</p>
        </div>
      `;
      
      toastContainer.appendChild(toast);
      document.body.appendChild(toastContainer);
      
      // Remove toast after 5 seconds
      setTimeout(() => {
        document.body.removeChild(toastContainer);
      }, 5000);
    }
    
    // Fetch and render lessons
    const lessons = await fetchLessons();
    renderLessons(lessons);
  }
  
  // Run initialization
  init();
})();

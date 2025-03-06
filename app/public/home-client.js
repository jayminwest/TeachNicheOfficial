(function() {
  // Check if we should show the auth dialog
  function checkAuthParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const showAuth = urlParams.get('auth') === 'signin';
    // const redirect = urlParams.get('redirect') || '/profile';
    
    if (showAuth) {
      // Create a modal dialog for authentication
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center';
      
      const modalContent = document.createElement('div');
      modalContent.className = 'bg-card border rounded-lg shadow-lg w-full max-w-md p-6 relative';
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.className = 'absolute top-4 right-4 text-muted-foreground hover:text-foreground';
      closeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      closeButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
      });
      
      // Add content
      const content = document.createElement('div');
      content.innerHTML = `
        <h2 class="text-lg font-semibold mb-4">Sign In</h2>
        <p class="mb-4">Please sign in to continue</p>
        <div class="space-y-2">
          <a href="/auth" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
            Continue to Sign In
          </a>
        </div>
      `;
      
      // Assemble modal
      modalContent.appendChild(closeButton);
      modalContent.appendChild(content);
      modalOverlay.appendChild(modalContent);
      
      // Add to body
      document.body.appendChild(modalOverlay);
      
      // Handle clicks outside the modal to close it
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          document.body.removeChild(modalOverlay);
        }
      });
    }
  }
  
  // Initialize
  checkAuthParams();
})();

// This script will be loaded client-side only
(function() {
  function getErrorMessage() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const messageParam = urlParams.get('message');
    
    if (!errorParam) return null;
    
    if (errorParam === 'callback_failed') {
      return messageParam || 'Failed to complete authentication';
    } else if (errorParam === 'no_code') {
      return 'No authentication code received';
    } else if (errorParam === 'no_session') {
      return 'No session created';
    } else if (errorParam === 'exception') {
      return messageParam || 'An unexpected error occurred';
    } else if (errorParam === 'flow_state_expired') {
      return 'Your authentication session expired. Please try signing in again.';
    } else {
      return `Error: ${errorParam}`;
    }
  }

  function renderAuthClient() {
    const container = document.querySelector('.min-h-screen > div');
    if (!container) return;
    
    // Get error message from URL parameters
    const errorMessage = getErrorMessage();
    
    // Create the sign-in button
    container.innerHTML = `
      <div class="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
        <div class="space-y-1 mb-4">
          <h1 class="text-2xl font-bold">Sign in</h1>
          <p class="text-muted-foreground">
            Sign in to access your account and lessons
          </p>
        </div>
        
        <div class="space-y-4">
          ${errorMessage ? `
            <div class="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
              <span>⚠️</span>
              <span>${errorMessage}</span>
            </div>
          ` : ''}
          
          <button id="google-sign-in" class="w-full h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Sign in with Google
          </button>
        </div>
        
        <div class="mt-6 text-center">
          <p class="text-sm text-muted-foreground">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </div>
    `;
    
    // Add event listener to the button
    document.getElementById('google-sign-in').addEventListener('click', function() {
      this.textContent = 'Signing in...';
      this.disabled = true;
      
      // Redirect to Google sign-in
      window.location.href = '/api/auth/signin';
    });
  }
  
  // Run the render function
  renderAuthClient();
})();

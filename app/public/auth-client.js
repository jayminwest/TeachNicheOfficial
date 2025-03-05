// This script will be loaded client-side only
(function() {
  function renderAuthClient() {
    const container = document.querySelector('.min-h-screen > div');
    if (!container) return;
    
    // Get any error message that might be present
    let errorMessage = null;
    const errorDiv = container.querySelector('.bg-destructive\\/10');
    if (errorDiv) {
      errorMessage = errorDiv.textContent.trim();
    }
    
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

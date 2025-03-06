// This is a simplified client-side only script to render the auth component
(function() {
  console.log('Auth client bundle initializing');
  
  // Create the auth component container
  const container = document.getElementById('auth-container');
  if (!container) {
    console.error('Auth container not found');
    return;
  }
  
  try {
    // Parse URL parameters
    const url = new URL(window.location.href);
    const error = url.searchParams.get('error') || null;
    // These parameters are parsed but currently unused
    // const redirect = url.searchParams.get('redirect') || null;
    // const showSignIn = url.searchParams.get('signin') === 'true';
    
    // Create the auth component
    const authComponent = document.createElement('div');
    authComponent.className = 'auth-component';
    
    // Show error if present
    if (error) {
      const errorElement = document.createElement('div');
      errorElement.className = 'p-4 mb-4 border border-red-300 bg-red-50 text-red-800 rounded-md';
      errorElement.innerHTML = `<p>${decodeURIComponent(error)}</p>`;
      authComponent.appendChild(errorElement);
    }
    
    // Create sign-in button that redirects to the actual auth page
    const signInButton = document.createElement('button');
    signInButton.className = 'w-full py-2 px-4 bg-primary text-white rounded-md mb-2';
    signInButton.textContent = 'Continue to Sign In';
    signInButton.onclick = function() {
      // Redirect to the Supabase auth page
      window.location.href = '/api/auth/signin';
    };
    
    // Create sign-up button
    const signUpButton = document.createElement('button');
    signUpButton.className = 'w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-md';
    signUpButton.textContent = 'Create an Account';
    signUpButton.onclick = function() {
      // Redirect to the Supabase sign-up page
      window.location.href = '/api/auth/signup';
    };
    
    // Add buttons to component
    authComponent.appendChild(signInButton);
    authComponent.appendChild(signUpButton);
    
    // Replace the container content with our component
    container.innerHTML = '';
    container.appendChild(authComponent);
    
    console.log('Auth client bundle initialized successfully');
  } catch (err) {
    console.error('Error initializing auth client bundle:', err);
    container.innerHTML = '<div class="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md"><h3 class="font-bold">Error</h3><p>There was a problem loading the authentication page. Please refresh to try again.</p></div>';
  }
})();

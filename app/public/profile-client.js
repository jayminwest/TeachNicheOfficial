// This script will be loaded client-side only
(function() {
  // State
  let user = null;
  let profile = null;
  let loading = true;
  let activeTab = 'profile';

  // Fetch user and profile data
  async function fetchUserData() {
    try {
      // Fetch user data from Supabase
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user data');
      }
      
      if (!data.user) {
        // Redirect to sign in if no user
        window.location.href = '/auth/signin?redirect=/profile';
        return;
      }
      
      user = data.user;
      
      // Now fetch profile data
      await fetchProfileData();
    } catch (err) {
      console.error('Error fetching user data:', err);
      // Redirect to sign in on error
      window.location.href = '/auth/signin?redirect=/profile';
    }
  }

  // Fetch profile data
  async function fetchProfileData() {
    try {
      if (!user?.id) return;
      
      const response = await fetch(`/api/profile?userId=${user.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile data');
      }
      
      profile = data.profile;
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      loading = false;
      renderProfile();
    }
  }

  // Render the profile UI
  function renderProfile() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    const cardContent = container.querySelector('.bg-card');
    if (!cardContent) return;
    
    // Update the header
    const header = container.querySelector('.flex.justify-between');
    if (header) {
      header.innerHTML = `
        <h1 class="text-2xl font-bold">Your Profile</h1>
        <button id="sign-out-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
          Sign Out
        </button>
      `;
      
      // Add event listener to sign out button
      document.getElementById('sign-out-btn').addEventListener('click', async () => {
        try {
          await fetch('/api/auth/signout', { method: 'POST' });
          window.location.href = '/';
        } catch (err) {
          console.error('Error signing out:', err);
        }
      });
    }
    
    // Create tabs
    cardContent.innerHTML = `
      <div class="border-b mb-4">
        <div class="flex space-x-2 mb-4" role="tablist">
          <button 
            role="tab" 
            data-tab="profile" 
            class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'profile' ? 'bg-background shadow-sm' : 'text-muted-foreground'}"
          >
            Profile
          </button>
          <button 
            role="tab" 
            data-tab="content" 
            class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'content' ? 'bg-background shadow-sm' : 'text-muted-foreground'}"
          >
            Content
          </button>
          <button 
            role="tab" 
            data-tab="settings" 
            class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'settings' ? 'bg-background shadow-sm' : 'text-muted-foreground'}"
          >
            Settings
          </button>
        </div>
      </div>
      
      <div id="tab-content" class="min-h-[300px]">
        ${renderTabContent()}
      </div>
    `;
    
    // Add event listeners to tabs
    document.querySelectorAll('[role="tab"]').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        
        // Update active tab styling
        document.querySelectorAll('[role="tab"]').forEach(t => {
          if (t.dataset.tab === activeTab) {
            t.classList.add('bg-background', 'shadow-sm');
            t.classList.remove('text-muted-foreground');
          } else {
            t.classList.remove('bg-background', 'shadow-sm');
            t.classList.add('text-muted-foreground');
          }
        });
        
        // Update tab content
        document.getElementById('tab-content').innerHTML = renderTabContent();
        
        // Initialize tab-specific functionality
        if (activeTab === 'profile') {
          initProfileForm();
        } else if (activeTab === 'content') {
          initContentManagement();
        } else if (activeTab === 'settings') {
          initAccountSettings();
        }
      });
    });
    
    // Initialize the active tab
    if (activeTab === 'profile') {
      initProfileForm();
    } else if (activeTab === 'content') {
      initContentManagement();
    } else if (activeTab === 'settings') {
      initAccountSettings();
    }
  }

  // Render the content for the active tab
  function renderTabContent() {
    if (activeTab === 'profile') {
      return `
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">Your Profile Information</h2>
          <form id="profile-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1" for="full_name">Full Name</label>
              <input 
                type="text" 
                id="full_name" 
                name="full_name" 
                value="${profile?.full_name || ''}" 
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" for="bio">Bio</label>
              <textarea 
                id="bio" 
                name="bio" 
                rows="4" 
                class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >${profile?.bio || ''}</textarea>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" for="social_media_tag">Social Media Tag</label>
              <input 
                type="text" 
                id="social_media_tag" 
                name="social_media_tag" 
                value="${profile?.social_media_tag || ''}" 
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <button 
              type="submit" 
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Save Changes
            </button>
          </form>
        </div>
      `;
    } else if (activeTab === 'content') {
      return `
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">Your Content</h2>
          <p class="text-muted-foreground">Manage your lessons and other content.</p>
          <div id="lessons-list" class="space-y-2">
            <div class="animate-pulse">
              <div class="h-10 bg-muted rounded w-full mb-2"></div>
              <div class="h-10 bg-muted rounded w-full mb-2"></div>
              <div class="h-10 bg-muted rounded w-full mb-2"></div>
            </div>
          </div>
          <a 
            href="/lessons/new" 
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Create New Lesson
          </a>
        </div>
      `;
    } else if (activeTab === 'settings') {
      return `
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">Account Settings</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-md font-medium mb-2">Email Address</h3>
              <p class="text-muted-foreground mb-1">${user?.email || 'No email address'}</p>
              <p class="text-xs text-muted-foreground">Your email address is managed through your authentication provider.</p>
            </div>
            
            <div>
              <h3 class="text-md font-medium mb-2">Payment Settings</h3>
              <div id="stripe-connect-container">
                ${profile?.stripe_account_id 
                  ? `<p class="text-green-600 mb-2">✓ Connected to Stripe</p>` 
                  : `<p class="text-muted-foreground mb-2">Connect to Stripe to receive payments for your lessons.</p>`
                }
                <button 
                  id="stripe-connect-btn" 
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                >
                  ${profile?.stripe_account_id ? 'Manage Stripe Account' : 'Connect with Stripe'}
                </button>
              </div>
            </div>
            
            <div>
              <h3 class="text-md font-medium mb-2">Delete Account</h3>
              <p class="text-muted-foreground mb-2">Permanently delete your account and all associated data.</p>
              <button 
                id="delete-account-btn" 
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    return '<div>Loading...</div>';
  }

  // Initialize profile form functionality
  function initProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const profileData = {
        full_name: formData.get('full_name'),
        bio: formData.get('bio'),
        social_media_tag: formData.get('social_media_tag')
      };
      
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to update profile');
        }
        
        // Update local profile data
        profile = { ...profile, ...profileData };
        
        // Show success message
        alert('Profile updated successfully!');
      } catch (err) {
        console.error('Error updating profile:', err);
        alert('Failed to update profile: ' + err.message);
      }
    });
  }

  // Initialize content management functionality
  function initContentManagement() {
    const lessonsList = document.getElementById('lessons-list');
    if (!lessonsList) return;
    
    // Fetch user's lessons
    async function fetchLessons() {
      try {
        const response = await fetch('/api/lessons/user');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch lessons');
        }
        
        if (data.lessons.length === 0) {
          lessonsList.innerHTML = `
            <p class="text-muted-foreground">You haven't created any lessons yet.</p>
          `;
          return;
        }
        
        lessonsList.innerHTML = data.lessons.map(lesson => `
          <div class="flex items-center justify-between p-3 border rounded-md">
            <div>
              <h3 class="font-medium">${lesson.title}</h3>
              <p class="text-sm text-muted-foreground">${lesson.public ? 'Public' : 'Private'}</p>
            </div>
            <div class="flex space-x-2">
              <a 
                href="/lessons/${lesson.id}" 
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
              >
                View
              </a>
              <a 
                href="/lessons/${lesson.id}/edit" 
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
              >
                Edit
              </a>
            </div>
          </div>
        `).join('');
      } catch (err) {
        console.error('Error fetching lessons:', err);
        lessonsList.innerHTML = `
          <p class="text-red-500">Failed to load lessons: ${err.message}</p>
        `;
      }
    }
    
    fetchLessons();
  }

  // Initialize account settings functionality
  function initAccountSettings() {
    const stripeConnectBtn = document.getElementById('stripe-connect-btn');
    if (stripeConnectBtn) {
      stripeConnectBtn.addEventListener('click', async () => {
        try {
          if (profile?.stripe_account_id) {
            // If already connected, redirect to Stripe dashboard
            window.location.href = '/api/stripe/dashboard';
          } else {
            // If not connected, start onboarding
            const response = await fetch('/api/stripe/connect');
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || 'Failed to connect with Stripe');
            }
            
            // Redirect to Stripe onboarding
            window.location.href = data.url;
          }
        } catch (err) {
          console.error('Error with Stripe connect:', err);
          alert('Failed to connect with Stripe: ' + err.message);
        }
      });
    }
    
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
          // Implement account deletion logic
          alert('Account deletion is not implemented in this demo.');
        }
      });
    }
  }

  // Initialize the page
  async function init() {
    await fetchUserData();
  }
  
  // Run initialization
  init();
})();

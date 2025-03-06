// This script will be loaded client-side only
(function() {
  // State
  let uploadUrl = '';
  let assetId = '';
  let playbackId = '';
  let status = 'idle';
  let error = null;

  // Render the debug UI
  function renderDebugUI() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    const cardContent = container.querySelector('.bg-card');
    if (!cardContent) return;
    
    cardContent.innerHTML = `
      <h2 class="text-xl font-semibold mb-4">Create Mux Upload URL</h2>
      
      <div class="space-y-4">
        ${error ? `
          <div class="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <span>⚠️</span>
            <span>${error}</span>
          </div>
        ` : ''}
        
        <div>
          <label class="block text-sm font-medium mb-1">Upload URL</label>
          <div class="flex gap-2">
            <input 
              type="text" 
              id="upload-url" 
              value="${uploadUrl}" 
              readonly
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button 
              id="create-url-btn" 
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              ${status === 'loading' ? 'disabled' : ''}
            >
              ${status === 'loading' ? 'Creating...' : 'Create URL'}
            </button>
          </div>
        </div>
        
        ${assetId ? `
          <div>
            <label class="block text-sm font-medium mb-1">Asset ID</label>
            <input 
              type="text" 
              value="${assetId}" 
              readonly
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        ` : ''}
        
        ${playbackId ? `
          <div>
            <label class="block text-sm font-medium mb-1">Playback ID</label>
            <input 
              type="text" 
              value="${playbackId}" 
              readonly
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Preview</label>
            <div class="aspect-video bg-black rounded-md overflow-hidden">
              <iframe
                src="https://stream.mux.com/${playbackId}.m3u8"
                width="100%"
                height="100%"
                frameborder="0"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        ` : ''}
        
        <div class="flex gap-2">
          <button 
            id="copy-url-btn" 
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
            ${!uploadUrl ? 'disabled' : ''}
          >
            Copy URL
          </button>
          
          <button 
            id="check-status-btn" 
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
            ${!assetId ? 'disabled' : ''}
          >
            Check Status
          </button>
          
          <button 
            id="reset-btn" 
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Reset
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('create-url-btn').addEventListener('click', createUploadUrl);
    document.getElementById('copy-url-btn').addEventListener('click', copyUploadUrl);
    document.getElementById('check-status-btn').addEventListener('click', checkAssetStatus);
    document.getElementById('reset-btn').addEventListener('click', resetForm);
  }

  // Create a new upload URL
  async function createUploadUrl() {
    try {
      status = 'loading';
      error = null;
      renderDebugUI();
      
      const response = await fetch('/api/mux/temp-asset', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create upload URL');
      }
      
      uploadUrl = data.url;
      assetId = data.assetId;
      status = 'success';
    } catch (err) {
      console.error('Error creating upload URL:', err);
      error = err.message || 'An unexpected error occurred';
      status = 'error';
    } finally {
      renderDebugUI();
    }
  }

  // Copy the upload URL to clipboard
  function copyUploadUrl() {
    if (!uploadUrl) return;
    
    navigator.clipboard.writeText(uploadUrl)
      .then(() => {
        const btn = document.getElementById('copy-url-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);
        error = 'Failed to copy URL to clipboard';
        renderDebugUI();
      });
  }

  // Check the status of the asset
  async function checkAssetStatus() {
    if (!assetId) return;
    
    try {
      status = 'loading';
      error = null;
      renderDebugUI();
      
      const response = await fetch(`/api/mux/wait-for-asset?assetId=${assetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to check asset status');
      }
      
      if (data.playbackId) {
        playbackId = data.playbackId;
      }
      
      status = 'success';
    } catch (err) {
      console.error('Error checking asset status:', err);
      error = err.message || 'An unexpected error occurred';
      status = 'error';
    } finally {
      renderDebugUI();
    }
  }

  // Reset the form
  function resetForm() {
    uploadUrl = '';
    assetId = '';
    playbackId = '';
    status = 'idle';
    error = null;
    renderDebugUI();
  }

  // Initialize the page
  function init() {
    renderDebugUI();
  }
  
  // Run initialization
  init();
})();

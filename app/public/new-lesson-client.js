(function() {
  // Check authentication status
  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/user');
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('Authentication check failed:', error);
      // Redirect to sign in page
      window.location.href = '/auth?redirect=/lessons/new';
      return null;
    }
  }
  
  // Show error toast
  function showErrorToast(title, message) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    toastContainer.style.maxWidth = '420px';
    
    const toast = document.createElement('div');
    toast.className = 'bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg flex items-start gap-3';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <div>
        <h3 class="font-medium">${title}</h3>
        <p class="text-sm">${message}</p>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
      document.body.removeChild(toastContainer);
    }, 5000);
  }
  
  // Show success toast
  function showSuccessToast(title, message) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    toastContainer.style.maxWidth = '420px';
    
    const toast = document.createElement('div');
    toast.className = 'bg-background text-foreground border p-4 rounded-md shadow-lg flex items-start gap-3';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      <div>
        <h3 class="font-medium">${title}</h3>
        <p class="text-sm">${message}</p>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
      document.body.removeChild(toastContainer);
    }, 5000);
  }
  
  // Render the lesson form
  function renderLessonForm() {
    const formContainer = document.getElementById('lesson-form-container');
    if (!formContainer) return;
    
    formContainer.innerHTML = `
      <form id="lesson-form" class="space-y-6">
        <div class="space-y-2">
          <label for="title" class="block text-sm font-medium">Title</label>
          <input 
            type="text" 
            id="title" 
            name="title"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter lesson title"
            required
          />
        </div>
        
        <div class="space-y-2">
          <label for="description" class="block text-sm font-medium">Description</label>
          <textarea 
            id="description" 
            name="description"
            rows="3"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter lesson description"
            required
          ></textarea>
        </div>
        
        <div class="space-y-2">
          <label for="content" class="block text-sm font-medium">Content</label>
          <textarea 
            id="content" 
            name="content"
            rows="6"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter lesson content in markdown format"
            required
          ></textarea>
        </div>
        
        <div class="space-y-2">
          <label for="price" class="block text-sm font-medium">Price ($)</label>
          <input 
            type="number" 
            id="price" 
            name="price"
            min="0"
            step="0.01"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="0.00"
          />
        </div>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium">Video Upload</label>
          <div id="video-upload-container" class="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-muted/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto h-12 w-12 text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <p class="mt-2 text-sm text-muted-foreground">Drag and drop your video file here or click to browse</p>
            <input type="file" id="video-upload" class="hidden" accept="video/*" />
            <input type="hidden" id="mux-asset-id" name="muxAssetId" />
            <input type="hidden" id="mux-playback-id" name="muxPlaybackId" />
          </div>
          <div id="upload-status" class="hidden mt-2 text-sm"></div>
        </div>
        
        <div class="flex justify-end">
          <button 
            type="submit" 
            id="submit-button"
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Create Lesson
          </button>
        </div>
      </form>
    `;
    
    // Set up video upload functionality
    setupVideoUpload();
    
    // Set up form submission
    setupFormSubmission();
  }
  
  // Set up video upload functionality
  function setupVideoUpload() {
    const uploadContainer = document.getElementById('video-upload-container');
    const fileInput = document.getElementById('video-upload');
    const uploadStatus = document.getElementById('upload-status');
    
    if (!uploadContainer || !fileInput || !uploadStatus) return;
    
    uploadContainer.addEventListener('click', () => {
      fileInput.click();
    });
    
    uploadContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadContainer.classList.add('border-primary');
    });
    
    uploadContainer.addEventListener('dragleave', () => {
      uploadContainer.classList.remove('border-primary');
    });
    
    uploadContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadContainer.classList.remove('border-primary');
      
      if (e.dataTransfer?.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });
    
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        handleFileUpload(fileInput.files[0]);
      }
    });
    
    async function handleFileUpload(file) {
      // Show upload status
      uploadStatus.classList.remove('hidden');
      uploadStatus.innerHTML = `
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin h-4 w-4 mr-2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
          <span>Uploading video...</span>
        </div>
      `;
      
      try {
        // Get upload URL from API
        const uploadResponse = await fetch('/api/mux/upload-url');
        if (!uploadResponse.ok) {
          throw new Error('Failed to get upload URL');
        }
        
        const { uploadUrl, assetId } = await uploadResponse.json();
        
        // Upload file directly to Mux
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResult = await fetch(uploadUrl, {
          method: 'PUT',
          body: formData,
        });
        
        if (!uploadResult.ok) {
          throw new Error('Failed to upload video');
        }
        
        // Update status
        uploadStatus.innerHTML = `
          <div class="flex items-center text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Video uploaded successfully! Processing...</span>
          </div>
        `;
        
        // Set asset ID in hidden input
        document.getElementById('mux-asset-id').value = assetId;
        
        // Start checking asset status
        checkAssetStatus(assetId);
      } catch (error) {
        console.error('Upload error:', error);
        uploadStatus.innerHTML = `
          <div class="flex items-center text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Upload failed: ${error.message}</span>
          </div>
        `;
      }
    }
    
    async function checkAssetStatus(assetId) {
      try {
        const statusResponse = await fetch(`/api/mux/asset-status?assetId=${assetId}`);
        if (!statusResponse.ok) {
          throw new Error('Failed to check asset status');
        }
        
        const { status, playbackId } = await statusResponse.json();
        
        if (status === 'ready' && playbackId) {
          // Asset is ready
          uploadStatus.innerHTML = `
            <div class="flex items-center text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Video processed and ready!</span>
            </div>
          `;
          
          // Set playback ID in hidden input
          document.getElementById('mux-playback-id').value = playbackId;
        } else if (status === 'errored') {
          // Asset processing failed
          uploadStatus.innerHTML = `
            <div class="flex items-center text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>Video processing failed</span>
            </div>
          `;
        } else {
          // Asset is still processing, check again in 5 seconds
          setTimeout(() => checkAssetStatus(assetId), 5000);
        }
      } catch (error) {
        console.error('Status check error:', error);
        uploadStatus.innerHTML = `
          <div class="flex items-center text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Failed to check video status: ${error.message}</span>
          </div>
        `;
      }
    }
  }
  
  // Set up form submission
  function setupFormSubmission() {
    const form = document.getElementById('lesson-form');
    const submitButton = document.getElementById('submit-button');
    
    if (!form || !submitButton) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Disable submit button
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin h-4 w-4 mr-2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
        Creating...
      `;
      
      try {
        // Get form data
        const formData = new FormData(form);
        const lessonData = {
          title: formData.get('title'),
          description: formData.get('description'),
          content: formData.get('content'),
          price: parseFloat(formData.get('price') as string) || 0,
          muxAssetId: formData.get('muxAssetId'),
          muxPlaybackId: formData.get('muxPlaybackId'),
          status: 'published'
        };
        
        // Validate required fields
        if (!lessonData.title || !lessonData.description || !lessonData.content) {
          throw new Error('Missing required fields: title, description, and content are required');
        }
        
        // Check if video is uploaded
        if (!lessonData.muxAssetId) {
          throw new Error('Please upload a video before creating the lesson');
        }
        
        // Create lesson
        const response = await fetch('/api/lessons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lessonData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create lesson');
        }
        
        const lesson = await response.json();
        
        // Show success toast
        showSuccessToast(
          'Lesson Created!',
          'Your new lesson has been created and your video is now processing.'
        );
        
        // Start background video processing
        fetch('/api/lessons/process-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonId: lesson.id,
            muxAssetId: lessonData.muxAssetId,
            isPaid: lessonData.price > 0,
            currentStatus: 'draft'
          }),
        }).catch(error => {
          console.error('Failed to start background processing:', error);
        });
        
        // Redirect to the lesson page
        window.location.href = `/lessons/${lesson.id}`;
      } catch (error) {
        console.error('Lesson creation error:', error);
        
        // Show error toast
        showErrorToast(
          'Creation Failed',
          error.message || 'There was an error creating your lesson. Please try again.'
        );
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create Lesson';
      }
    });
  }
  
  // Initialize the page
  async function init() {
    // Check authentication
    const user = await checkAuth();
    if (!user) return;
    
    // Render the lesson form
    renderLessonForm();
  }
  
  // Run initialization
  init();
})();

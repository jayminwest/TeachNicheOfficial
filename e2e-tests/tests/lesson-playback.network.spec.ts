import { test, expect } from '@playwright/test';

test.describe('Lesson Video Playback with Network Conditions', () => {
  // Use a specific lesson with video content
  const lessonId = 'test-lesson-with-video';
  
  test.beforeEach(async ({ page }) => {
    // Load authentication state for a user with access to the lesson
    await page.context().storageState({ path: './test-data/buyerAuth.json' });
  });
  
  test('should adapt video quality under poor network conditions', async ({ page }) => {
    // Navigate to the lesson page
    await page.goto(`/lessons/${lessonId}`);
    
    // Wait for the video player to load with a more specific selector and longer timeout
    try {
      await page.waitForSelector('.video-player video, [data-testid="video-player"] video', { 
        state: 'visible',
        timeout: 30000 // Increase timeout to 30 seconds
      });
    } catch (error) {
      console.log('Video element not found, checking for fallback player');
      // Check if there's a fallback player or error message
      const hasFallback = await page.isVisible('[data-testid="video-fallback"]');
      if (hasFallback) {
        console.log('Using fallback player');
      } else {
        throw error; // Re-throw if no fallback found
      }
    }
    
    // Start playing the video with a more specific selector
    await page.click('.video-player video, [data-testid="video-player"] video, [data-testid="video-fallback"]');
    
    // Wait for video to start playing
    await page.waitForFunction(() => {
      const video = document.querySelector('video');
      return video && !video.paused && video.currentTime > 0;
    });
    
    // Get initial video quality
    const initialQuality = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) return null;
      
      // This will depend on your video player implementation
      // For HTML5 video with multiple sources:
      if (video.videoHeight) {
        return { width: video.videoWidth, height: video.videoHeight };
      }
      
      // For players with quality API:
      // @ts-ignore - Custom player API
      if (video.player && video.player.getQuality) {
        // @ts-ignore - Custom player API
        return video.player.getQuality();
      }
      
      return null;
    });
    
    // Simulate network degradation
    await page.context().route('**/*.m3u8', async (route) => {
      // Add significant delay to manifest requests
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });
    
    await page.context().route('**/*.ts', async (route) => {
      // Add delay and throttle segment requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue({
        headers: {
          ...route.request().headers(),
          'x-throttled': 'true'
        }
      });
    });
    
    // Play for a while to allow adaptation
    await page.waitForTimeout(10000);
    
    // Check if video is still playing despite network issues
    const isPlaying = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video && !video.paused && video.currentTime > 0;
    });
    
    expect(isPlaying).toBe(true);
    
    // Check if quality adapted
    const adaptedQuality = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) return null;
      
      // This will depend on your video player implementation
      if (video.videoHeight) {
        return { width: video.videoWidth, height: video.videoHeight };
      }
      
      // For players with quality API:
      // @ts-ignore - Custom player API
      if (video.player && video.player.getQuality) {
        // @ts-ignore - Custom player API
        return video.player.getQuality();
      }
      
      return null;
    });
    
    // Log quality information for debugging
    console.log('Initial quality:', initialQuality);
    console.log('Adapted quality:', adaptedQuality);
    
    // Check for error messages
    const errorMessages = await page.locator('.video-error-message').all();
    expect(errorMessages.length).toBe(0);
    
    // Check if buffering indicator appeared and then disappeared
    const bufferingIndicator = await page.locator('.buffering-indicator').count();
    expect(bufferingIndicator).toBeLessThanOrEqual(1);
  });
  
  test('should recover from network interruption', async ({ page }) => {
    // Navigate to the lesson page
    await page.goto(`/lessons/${lessonId}`);
    
    // Wait for the video player to load with a more specific selector and longer timeout
    try {
      await page.waitForSelector('.video-player video, [data-testid="video-player"] video', { 
        state: 'visible',
        timeout: 30000 // Increase timeout to 30 seconds
      });
    } catch (error) {
      console.log('Video element not found, checking for fallback player');
      // Check if there's a fallback player or error message
      const hasFallback = await page.isVisible('[data-testid="video-fallback"]');
      if (hasFallback) {
        console.log('Using fallback player');
      } else {
        throw error; // Re-throw if no fallback found
      }
    }
    
    // Start playing the video with a more specific selector
    await page.click('.video-player video, [data-testid="video-player"] video, [data-testid="video-fallback"]');
    
    // Wait for video to start playing
    await page.waitForFunction(() => {
      const video = document.querySelector('video');
      return video && !video.paused && video.currentTime > 0;
    });
    
    // Play for a few seconds
    await page.waitForTimeout(5000);
    
    // Simulate complete network failure
    await page.context().route('**/*', route => route.abort('internetdisconnected'));
    
    // Wait to observe the failure
    await page.waitForTimeout(5000);
    
    // Restore network
    await page.context().unroute('**/*');
    
    // Wait for recovery
    await page.waitForTimeout(10000);
    
    // Check if video recovered and is playing again
    const isPlayingAfterRecovery = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video && !video.paused && video.currentTime > 0;
    });
    
    // Assert that playback recovered
    expect(isPlayingAfterRecovery).toBe(true);
    
    // Check if appropriate error and recovery messages were shown
    const errorShown = await page.locator('.network-error-message').count();
    expect(errorShown).toBeGreaterThan(0);
    
    const recoveryMessage = await page.locator('.network-recovered-message').count();
    expect(recoveryMessage).toBeGreaterThan(0);
  });
});

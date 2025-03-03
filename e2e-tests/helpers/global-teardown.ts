import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for E2E tests
 * 
 * This script:
 * 1. Cleans up temporary test data
 * 2. Performs any necessary environment cleanup
 */
async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...');
  
  // Clean up any test-specific data that shouldn't persist between test runs
  // This could include test user data, uploaded files, etc.
  
  // Example: Clean up temporary files
  const tempDir = path.join(__dirname, '..', 'temp');
  if (fs.existsSync(tempDir)) {
    try {
      // Only remove files, not the directory itself
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        if (!file.startsWith('.') && file !== 'README.md') { // Skip hidden files and README
          fs.unlinkSync(path.join(tempDir, file));
        }
      }
      console.log('Temporary files cleaned up');
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }
  }
  
  // Note: We're intentionally not removing authentication states
  // as they can be reused between test runs for efficiency
  
  console.log('Global teardown completed');
}

export default globalTeardown;

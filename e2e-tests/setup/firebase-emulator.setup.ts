import { test as setup } from '@playwright/test';

setup('setup firebase emulators', async ({ page }) => {
  // Set environment variables for emulator use
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  
  // Configure the browser to use emulators
  await page.addInitScript(() => {
    window.FIREBASE_USE_EMULATORS = true;
  });
  
  // Create a test user in the emulator
  // This would typically be done using the Firebase Admin SDK
  // For this example, we'll use the REST API
  const response = await fetch('http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword',
      returnSecureToken: true
    }),
  });
  
  if (!response.ok) {
    console.error('Failed to create test user in emulator');
    console.error(await response.text());
  }
  
  console.log('Firebase emulator setup complete');
});
import { test as setup } from '@playwright/test';

setup('setup firebase emulators', async ({ page }) => {
  // Set environment variables for emulator use
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  
  // Configure the browser to use emulators
  await page.addInitScript(() => {
    window.FIREBASE_USE_EMULATORS = true;
  });
  
  // Create a test user in the emulator
  // This would typically be done using the Firebase Admin SDK
  // For this example, we'll use the REST API
  const response = await fetch('http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword',
      returnSecureToken: true
    }),
  });
  
  if (!response.ok) {
    console.error('Failed to create test user in emulator');
    console.error(await response.text());
  }
  
  console.log('Firebase emulator setup complete');
});

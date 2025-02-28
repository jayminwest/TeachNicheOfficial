import { test as setup, BrowserContext } from '@playwright/test';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'fs';
import path from 'path';

let testEnv: RulesTestEnvironment | undefined;

setup.beforeAll(async () => {
  try {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    testEnv = await initializeTestEnvironment({
      projectId: 'teach-niche-test',
      firestore: {
        host: 'localhost',
        port: 8080,
        rules: fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf8') : ''
      },
      auth: {
        host: 'localhost',
        port: 9099
      }
    });
  } catch (error) {
    console.error('Error initializing test environment:', error);
  }
});

setup.afterAll(async () => {
  try {
    await testEnv?.cleanup();
  } catch (error) {
    console.error('Error cleaning up test environment:', error);
  }
});

setup.beforeEach(async ({ context }: { context: BrowserContext }) => {
  // Clear all emulator data between tests
  await testEnv?.clearFirestore();
  await testEnv?.clearAuthentication();

  // Set emulator flags in browser context
  await context.addInitScript(() => {
    (window as any).FIREBASE_USE_EMULATORS = true;
  });
});

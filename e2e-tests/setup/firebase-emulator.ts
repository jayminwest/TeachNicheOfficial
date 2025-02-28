import { test as setup } from '@playwright/test';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'fs';

let testEnv: RulesTestEnvironment | undefined;

setup.beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'teach-niche-test',
    firestore: {
      host: 'localhost',
      port: 8080,
      rules: fs.readFileSync('../../firestore.rules', 'utf8')
    },
    auth: {
      host: 'localhost',
      port: 9099
    }
  });
});

setup.afterAll(async () => {
  await testEnv.cleanup();
});

setup.beforeEach(async ({ context }) => {
  // Clear all emulator data between tests
  await testEnv.clearFirestore();
  await testEnv.clearAuthentication();

  // Set emulator flags in browser context
  await context.addInitScript(() => {
    window.FIREBASE_USE_EMULATORS = true;
  });
});

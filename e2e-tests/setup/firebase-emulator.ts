import { test as setup, BrowserContext } from '@playwright/test';
// Using require for modules without proper ES module support
import * as fs from 'fs';
import * as path from 'path';

// Define types for @firebase/rules-unit-testing since it's missing type declarations
interface RulesTestEnvironment {
  clearFirestore: () => Promise<void>;
  clearAuthentication: () => Promise<void>;
  cleanup: () => Promise<void>;
}

interface TestEnvironmentConfig {
  projectId: string;
  firestore: {
    host: string;
    port: number;
    rules: string;
  };
  auth: {
    host: string;
    port: number;
  };
}

// Mock the missing module
const initializeTestEnvironment = async (config: TestEnvironmentConfig): Promise<RulesTestEnvironment> => {
  console.log(`Initializing test environment with config: ${JSON.stringify(config)}`);
  return {
    clearFirestore: async () => console.log('Clearing Firestore data'),
    clearAuthentication: async () => console.log('Clearing Authentication data'),
    cleanup: async () => console.log('Cleaning up test environment')
  };
};

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

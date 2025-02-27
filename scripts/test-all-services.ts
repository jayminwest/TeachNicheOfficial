import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Define the tests to run
const tests = [
  { name: 'Database Service', script: 'scripts/test-database-service.ts' },
  { name: 'Firebase Storage', script: 'scripts/test-firebase-storage.ts' },
  { name: 'Email Service', script: 'scripts/test-email-service.ts' }
];

async function runTest(test: { name: string, script: string }): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n----- Running ${test.name} Tests -----\n`);
    
    const child = spawn('node', ['--loader', 'ts-node/esm', test.script], {
      stdio: 'inherit',
      env: process.env
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${test.name} tests passed\n`);
        resolve(true);
      } else {
        console.error(`\n❌ ${test.name} tests failed with code ${code}\n`);
        resolve(false);
      }
    });
  });
}

async function runAllTests() {
  console.log('Starting comprehensive service tests...');
  
  let allPassed = true;
  const results = [];
  
  for (const test of tests) {
    const passed = await runTest(test);
    results.push({ name: test.name, passed });
    if (!passed) allPassed = false;
  }
  
  // Print summary
  console.log('\n----- Test Summary -----');
  for (const result of results) {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  }
  
  if (allPassed) {
    console.log('\n✅ All tests passed successfully');
    process.exit(0);
  } else {
    console.error('\n❌ Some tests failed');
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Error running tests:', err);
  process.exit(1);
});

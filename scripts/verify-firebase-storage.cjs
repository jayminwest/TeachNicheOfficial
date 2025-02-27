// This script verifies Firebase Storage configuration and bucket existence
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import fs from 'fs';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log(`${colors.bold}Firebase Storage Verification Tool${colors.reset}`);
console.log('This script will verify your Firebase Storage configuration and bucket existence.\n');

// Verify Firebase configuration
console.log(`${colors.bold}Step 1: Verifying Firebase configuration...${colors.reset}`);
let configValid = true;

for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value) {
    console.log(`${colors.red}✗ Missing ${key}${colors.reset}`);
    configValid = false;
  } else {
    console.log(`${colors.green}✓ ${key} is set${colors.reset}`);
  }
}

if (!configValid) {
  console.log(`\n${colors.red}${colors.bold}Firebase configuration is incomplete. Please check your environment variables.${colors.reset}`);
  process.exit(1);
}

console.log(`\n${colors.green}Firebase configuration is valid.${colors.reset}`);

// Initialize Firebase
console.log(`\n${colors.bold}Step 2: Initializing Firebase...${colors.reset}`);
const app = initializeApp(firebaseConfig);
console.log(`${colors.green}Firebase initialized with project: ${firebaseConfig.projectId}${colors.reset}`);

// Initialize Storage
console.log(`\n${colors.bold}Step 3: Initializing Firebase Storage...${colors.reset}`);
const storage = getStorage(app);
console.log(`${colors.green}Firebase Storage initialized with bucket: ${firebaseConfig.storageBucket}${colors.reset}`);

// Test bucket existence with a simple operation
console.log(`\n${colors.bold}Step 4: Testing bucket existence...${colors.reset}`);

// Create a test file
const testFilePath = 'test-file.txt';
const testFileContent = 'This is a test file for Firebase Storage verification.';
fs.writeFileSync(testFilePath, testFileContent);

// Upload the test file
console.log(`Uploading test file to Firebase Storage...`);
const testStoragePath = `verification/test-${Date.now()}.txt`;
const storageRef = ref(storage, testStoragePath);

uploadBytes(storageRef, fs.readFileSync(testFilePath))
  .then(snapshot => {
    console.log(`${colors.green}✓ File uploaded successfully!${colors.reset}`);
    console.log(`File size: ${snapshot.metadata.size} bytes`);
    console.log(`Content type: ${snapshot.metadata.contentType}`);
    
    // Get download URL
    return getDownloadURL(storageRef);
  })
  .then(url => {
    console.log(`${colors.green}✓ Download URL generated:${colors.reset} ${url}`);
    
    // Clean up - delete the test file
    return deleteObject(storageRef);
  })
  .then(() => {
    console.log(`${colors.green}✓ Test file deleted from storage${colors.reset}`);
    
    console.log(`\n${colors.bold}${colors.green}Firebase Storage is properly configured and accessible!${colors.reset}`);
    
    // Clean up local test file
    fs.unlinkSync(testFilePath);
    process.exit(0);
  })
  .catch(error => {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    console.log(`Error code: ${error.code}`);
    
    if (error.code === 'storage/object-not-found') {
      console.log(`\n${colors.yellow}The bucket exists but the file was not found. This is likely a permissions issue.${colors.reset}`);
    } else if (error.code === 'storage/unauthorized') {
      console.log(`\n${colors.yellow}The bucket exists but you don't have permission to access it.${colors.reset}`);
    } else if (error.code === 'storage/unknown') {
      console.log(`\n${colors.red}The bucket may not exist or is not accessible.${colors.reset}`);
      console.log(`${colors.yellow}Verify that:${colors.reset}`);
      console.log(`1. You've created the storage bucket in Firebase Console`);
      console.log(`2. The bucket name matches your configuration: ${firebaseConfig.storageBucket}`);
      console.log(`3. The bucket region is accessible from your current location`);
      console.log(`4. Your Firebase project has billing enabled (required for some operations)`);
    }
    
    // Clean up local test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
    process.exit(1);
  });
// This script verifies Firebase Storage configuration and bucket existence
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const fs = require('fs');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log(`${colors.bold}Firebase Storage Verification Tool${colors.reset}`);
console.log('This script will verify your Firebase Storage configuration and bucket existence.\n');

// Verify Firebase configuration
console.log(`${colors.bold}Step 1: Verifying Firebase configuration...${colors.reset}`);
let configValid = true;

for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value) {
    console.log(`${colors.red}✗ Missing ${key}${colors.reset}`);
    configValid = false;
  } else {
    console.log(`${colors.green}✓ ${key} is set${colors.reset}`);
  }
}

if (!configValid) {
  console.log(`\n${colors.red}${colors.bold}Firebase configuration is incomplete. Please check your environment variables.${colors.reset}`);
  process.exit(1);
}

console.log(`\n${colors.green}Firebase configuration is valid.${colors.reset}`);

// Initialize Firebase
console.log(`\n${colors.bold}Step 2: Initializing Firebase...${colors.reset}`);
const app = initializeApp(firebaseConfig);
console.log(`${colors.green}Firebase initialized with project: ${firebaseConfig.projectId}${colors.reset}`);

// Initialize Storage
console.log(`\n${colors.bold}Step 3: Initializing Firebase Storage...${colors.reset}`);
const storage = getStorage(app);
console.log(`${colors.green}Firebase Storage initialized with bucket: ${firebaseConfig.storageBucket}${colors.reset}`);

// Test bucket existence with a simple operation
console.log(`\n${colors.bold}Step 4: Testing bucket existence...${colors.reset}`);

// Create a test file
const testFilePath = 'test-file.txt';
const testFileContent = 'This is a test file for Firebase Storage verification.';
fs.writeFileSync(testFilePath, testFileContent);

// Upload the test file
console.log(`Uploading test file to Firebase Storage...`);
const testStoragePath = `test/verification-${Date.now()}.txt`;
const storageRef = ref(storage, testStoragePath);

uploadBytes(storageRef, fs.readFileSync(testFilePath))
  .then(snapshot => {
    console.log(`${colors.green}✓ File uploaded successfully!${colors.reset}`);
    console.log(`File size: ${snapshot.metadata.size} bytes`);
    console.log(`Content type: ${snapshot.metadata.contentType}`);
    
    // Get download URL
    return getDownloadURL(storageRef);
  })
  .then(url => {
    console.log(`${colors.green}✓ Download URL generated:${colors.reset} ${url}`);
    
    // Clean up - delete the test file
    return deleteObject(storageRef);
  })
  .then(() => {
    console.log(`${colors.green}✓ Test file deleted from storage${colors.reset}`);
    
    console.log(`\n${colors.bold}${colors.green}Firebase Storage is properly configured and accessible!${colors.reset}`);
    
    // Clean up local test file
    fs.unlinkSync(testFilePath);
    process.exit(0);
  })
  .catch(error => {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    console.log(`Error code: ${error.code}`);
    
    if (error.code === 'storage/object-not-found') {
      console.log(`\n${colors.yellow}The bucket exists but the file was not found. This is likely a permissions issue.${colors.reset}`);
    } else if (error.code === 'storage/unauthorized') {
      console.log(`\n${colors.yellow}The bucket exists but you don't have permission to access it.${colors.reset}`);
    } else if (error.code === 'storage/unknown') {
      console.log(`\n${colors.red}The bucket may not exist or is not accessible.${colors.reset}`);
      console.log(`${colors.yellow}Verify that:${colors.reset}`);
      console.log(`1. You've created the storage bucket in Firebase Console`);
      console.log(`2. The bucket name matches your configuration: ${firebaseConfig.storageBucket}`);
      console.log(`3. The bucket region is accessible from your current location`);
      console.log(`4. Your Firebase project has billing enabled (required for some operations)`);
    }
    
    // Clean up local test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
    process.exit(1);
  });

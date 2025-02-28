#!/usr/bin/env node

/**
 * Setup Categories Script
 * 
 * This script creates initial categories in Firestore.
 * It uses the mock categories from the categories API route.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Mock categories from the API route
const mockCategories = [
  { name: 'Kendama Basics', description: 'Fundamental techniques for beginners' },
  { name: 'Intermediate Tricks', description: 'More advanced techniques' },
  { name: 'Advanced Combos', description: 'Complex combinations for experts' },
  { name: 'Competition Skills', description: 'Techniques for competitive play' }
];

// Initialize Firebase
function initializeFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    return { app, db };
  } catch (error) {
    console.error(`${colors.red}Error initializing Firebase:${colors.reset}`, error);
    process.exit(1);
  }
}

// Check if categories already exist
async function checkExistingCategories(db: any) {
  try {
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef);
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log(`${colors.yellow}Categories already exist in Firestore:${colors.reset}`);
      querySnapshot.forEach(doc => {
        console.log(`  - ${doc.data().name}: ${doc.data().description}`);
      });
      return querySnapshot.size;
    }
    
    return 0;
  } catch (error) {
    console.error(`${colors.red}Error checking existing categories:${colors.reset}`, error);
    return -1;
  }
}

// Create categories in Firestore
async function createCategories(db: any) {
  try {
    const categoriesRef = collection(db, 'categories');
    
    console.log(`${colors.blue}Creating categories in Firestore...${colors.reset}`);
    
    // Check if we have permission issues
    try {
      for (const category of mockCategories) {
        await addDoc(categoriesRef, category);
        console.log(`  - Created category: ${category.name}`);
      }
      
      console.log(`${colors.green}Successfully created ${mockCategories.length} categories!${colors.reset}`);
    } catch (permissionError) {
      if (permissionError.code === 'permission-denied') {
        console.error(`${colors.red}Permission denied error:${colors.reset}`, permissionError);
        console.log(`${colors.yellow}You need to update your Firestore security rules to allow writes to the categories collection.${colors.reset}`);
        console.log(`${colors.yellow}Please follow these steps:${colors.reset}`);
        console.log(`1. Go to the Firebase Console: ${colors.blue}https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules${colors.reset}`);
        console.log(`2. Update your security rules to allow writes to the categories collection:`);
        console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if true; // Temporarily allow all writes for setup
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
        `);
        console.log(`3. Click "Publish" and then run this script again.`);
      } else {
        console.error(`${colors.red}Error creating categories:${colors.reset}`, permissionError);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error creating categories:${colors.reset}`, error);
  }
}

// Main function
async function main() {
  console.log(`${colors.cyan}Setup Categories Script${colors.reset}`);
  
  // Check if required environment variables are set
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error(`${colors.red}Error: Firebase configuration not found in .env.local${colors.reset}`);
    console.log(`${colors.yellow}Please run the setup-firebase.ts script first${colors.reset}`);
    process.exit(1);
  }
  
  // Initialize Firebase
  const { db } = initializeFirebase();
  
  // Check if categories already exist
  const existingCount = await checkExistingCategories(db);
  
  if (existingCount > 0) {
    console.log(`${colors.yellow}Found ${existingCount} existing categories.${colors.reset}`);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`${colors.yellow}Do you want to add the mock categories anyway? (y/n)${colors.reset} `, async (answer: string) => {
      if (answer.toLowerCase() === 'y') {
        await createCategories(db);
      } else {
        console.log(`${colors.blue}Skipping category creation.${colors.reset}`);
      }
      rl.close();
    });
  } else if (existingCount === 0) {
    // No existing categories, create them
    await createCategories(db);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
  process.exit(1);
});

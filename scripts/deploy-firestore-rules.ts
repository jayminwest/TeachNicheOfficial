#!/usr/bin/env node

/**
 * Deploy Firestore Rules Script
 * 
 * This script helps deploy Firestore security rules.
 * It requires the Firebase CLI to be installed.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

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

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if firestore.rules file exists
function checkRulesFile() {
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  return fs.existsSync(rulesPath);
}

// Create firebase.json if it doesn't exist
function createFirebaseJson() {
  const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
  
  if (!fs.existsSync(firebaseJsonPath)) {
    const firebaseJson = {
      "firestore": {
        "rules": "firestore.rules",
        "indexes": "firestore.indexes.json"
      },
      "storage": {
        "rules": "storage.rules"
      }
    };
    
    fs.writeFileSync(firebaseJsonPath, JSON.stringify(firebaseJson, null, 2));
    console.log(`${colors.green}Created firebase.json${colors.reset}`);
  }
}

// Create firestore.indexes.json if it doesn't exist
function createFirestoreIndexes() {
  const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
  
  if (!fs.existsSync(indexesPath)) {
    const indexes = {
      "indexes": [],
      "fieldOverrides": []
    };
    
    fs.writeFileSync(indexesPath, JSON.stringify(indexes, null, 2));
    console.log(`${colors.green}Created firestore.indexes.json${colors.reset}`);
  }
}

// Deploy Firestore rules
function deployRules() {
  try {
    console.log(`${colors.blue}Deploying Firestore rules...${colors.reset}`);
    execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
    console.log(`${colors.green}Successfully deployed Firestore rules!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error deploying Firestore rules:${colors.reset}`, error);
  }
}

// Main function
function main() {
  console.log(`${colors.cyan}Deploy Firestore Rules Script${colors.reset}`);
  
  // Check if Firebase CLI is installed
  if (!checkFirebaseCLI()) {
    console.error(`${colors.red}Error: Firebase CLI is not installed${colors.reset}`);
    console.log(`${colors.yellow}Please install Firebase CLI with:${colors.reset} npm install -g firebase-tools`);
    process.exit(1);
  }
  
  // Check if firestore.rules file exists
  if (!checkRulesFile()) {
    console.error(`${colors.red}Error: firestore.rules file not found${colors.reset}`);
    console.log(`${colors.yellow}Please create a firestore.rules file in the project root${colors.reset}`);
    process.exit(1);
  }
  
  // Create firebase.json if it doesn't exist
  createFirebaseJson();
  
  // Create firestore.indexes.json if it doesn't exist
  createFirestoreIndexes();
  
  // Deploy Firestore rules
  deployRules();
}

// Run the script
main();

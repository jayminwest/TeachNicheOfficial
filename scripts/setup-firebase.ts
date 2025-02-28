#!/usr/bin/env node

/**
 * Firebase Setup Script
 * 
 * This script helps set up and verify your Firebase configuration.
 * It checks for required environment variables and provides guidance
 * on setting up Firebase services.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

// Optional environment variables
const optionalEnvVars = [
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'NEXT_PUBLIC_FIREBASE_USE_EMULATORS',
];

// Function to check if .env.local exists
function checkEnvFile(): boolean {
  const envPath = path.join(process.cwd(), '.env.local');
  return fs.existsSync(envPath);
}

// Function to create .env.local template
function createEnvTemplate() {
  const envPath = path.join(process.cwd(), '.env.local');
  const template = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Development Settings
# NEXT_PUBLIC_FIREBASE_USE_EMULATORS=true
`;

  fs.writeFileSync(envPath, template);
  console.log(`${colors.green}Created .env.local template${colors.reset}`);
  console.log(`${colors.yellow}Please fill in your Firebase configuration values in .env.local${colors.reset}`);
}

// Function to check environment variables
function checkEnvVars(): { missing: string[], present: string[] } {
  const missing: string[] = [];
  const present: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    } else {
      present.push(envVar);
    }
  }

  return { missing, present };
}

// Function to print setup instructions
function printSetupInstructions() {
  console.log(`
${colors.cyan}=== Firebase Setup Instructions ===${colors.reset}

1. Go to ${colors.blue}https://console.firebase.google.com/${colors.reset}
2. Click "Add project" or select your existing project
3. Once in your project, click the web icon (</>) to add a web app
4. Register your app with a nickname (e.g., "Teach Niche Web")
5. Copy the configuration values and add them to your .env.local file

${colors.cyan}=== Required Services ===${colors.reset}

1. ${colors.yellow}Authentication${colors.reset}
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication
   - Optionally enable Google authentication

2. ${colors.yellow}Firestore Database${colors.reset}
   - Go to Firestore Database
   - Create database (start in test mode for development)
   - Set up initial collections if needed

3. ${colors.yellow}Storage${colors.reset}
   - Go to Storage
   - Initialize storage
   - Set up security rules

${colors.cyan}=== After Setup ===${colors.reset}

Run this script again to verify your configuration:
${colors.green}npm run setup:firebase${colors.reset}
`);
}

// Function to verify Firebase configuration
function verifyFirebaseConfig() {
  console.log(`${colors.cyan}=== Firebase Configuration Verification ===${colors.reset}`);
  
  // Check if .env.local exists
  if (!checkEnvFile()) {
    console.log(`${colors.red}Error: .env.local file not found${colors.reset}`);
    console.log(`${colors.yellow}Creating template .env.local file...${colors.reset}`);
    createEnvTemplate();
    return;
  }
  
  // Check environment variables
  const { missing, present } = checkEnvVars();
  
  if (present.length > 0) {
    console.log(`${colors.green}Found configuration for:${colors.reset}`);
    present.forEach(envVar => {
      const value = process.env[envVar];
      const maskedValue = envVar.includes('API_KEY') || envVar.includes('APP_ID') 
        ? `${value?.substring(0, 4)}...${value?.substring(value.length - 4)}`
        : value;
      console.log(`  - ${envVar}: ${maskedValue}`);
    });
  }
  
  if (missing.length > 0) {
    console.log(`${colors.red}Missing required configuration:${colors.reset}`);
    missing.forEach(envVar => {
      console.log(`  - ${envVar}`);
    });
    printSetupInstructions();
    return;
  }
  
  console.log(`${colors.green}All required Firebase configuration is present!${colors.reset}`);
  
  // Check for optional environment variables
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
  if (missingOptional.length > 0) {
    console.log(`${colors.yellow}Optional configuration not set:${colors.reset}`);
    missingOptional.forEach(envVar => {
      console.log(`  - ${envVar}`);
    });
  }
  
  console.log(`${colors.green}Firebase configuration verified successfully!${colors.reset}`);
  console.log(`${colors.cyan}Next steps:${colors.reset}`);
  console.log(`1. Make sure you've set up Authentication, Firestore, and Storage in the Firebase console`);
  console.log(`2. Run your application with: ${colors.green}npm run dev${colors.reset}`);
}

// Main function
function main() {
  console.log(`${colors.cyan}Firebase Setup Script${colors.reset}`);
  verifyFirebaseConfig();
}

// Run the script
main();

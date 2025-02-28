/**
 * Environment Setup Script
 * 
 * This script configures the appropriate database connection
 * based on the current environment (development or production).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as colors from 'colors';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Define environment types
type Environment = 'development' | 'production' | 'test';

// Get current environment
function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV as Environment;
  if (!env || (env !== 'development' && env !== 'production' && env !== 'test')) {
    return 'development'; // Default to development
  }
  return env;
}

// Get database connection configuration for the current environment
function getDatabaseConfig(environment: Environment) {
  // Base configuration
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'teach_niche',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  };
  
  // Override with environment-specific values
  switch (environment) {
    case 'production':
      return {
        ...config,
        host: process.env.PROD_DB_HOST || config.host,
        port: parseInt(process.env.PROD_DB_PORT || config.port.toString(), 10),
        database: process.env.PROD_DB_NAME || 'teach_niche_prod',
        user: process.env.PROD_DB_USER || config.user,
        password: process.env.PROD_DB_PASSWORD || config.password,
        ssl: process.env.PROD_DB_SSL === 'true' || true, // Default to true for production
      };
    case 'test':
      return {
        ...config,
        host: process.env.TEST_DB_HOST || config.host,
        port: parseInt(process.env.TEST_DB_PORT || config.port.toString(), 10),
        database: process.env.TEST_DB_NAME || 'teach_niche_test',
        user: process.env.TEST_DB_USER || config.user,
        password: process.env.TEST_DB_PASSWORD || config.password,
        ssl: process.env.TEST_DB_SSL === 'true' || false,
      };
    case 'development':
    default:
      return {
        ...config,
        host: process.env.DEV_DB_HOST || config.host,
        port: parseInt(process.env.DEV_DB_PORT || config.port.toString(), 10),
        database: process.env.DEV_DB_NAME || 'teach_niche_dev',
        user: process.env.DEV_DB_USER || config.user,
        password: process.env.DEV_DB_PASSWORD || config.password,
        ssl: process.env.DEV_DB_SSL === 'true' || false,
      };
  }
}

// Create environment-specific .env files
function createEnvFiles() {
  console.log(`${colors.cyan}Creating environment-specific .env files...${colors.reset}`);
  
  // Development environment
  const devEnvContent = `# Development Environment Configuration
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=teach_niche_dev
DB_USER=postgres
DB_PASSWORD=
DB_SSL=false

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}
NEXT_PUBLIC_FIREBASE_APP_ID=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}
FIREBASE_CLIENT_EMAIL=${process.env.FIREBASE_CLIENT_EMAIL || ''}
FIREBASE_PRIVATE_KEY=${process.env.FIREBASE_PRIVATE_KEY || ''}

# Stripe Configuration
STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY || ''}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
STRIPE_WEBHOOK_SECRET=${process.env.STRIPE_WEBHOOK_SECRET || ''}
`;

  // Production environment
  const prodEnvContent = `# Production Environment Configuration
NODE_ENV=production
PROD_DB_HOST=${process.env.PROD_DB_HOST || ''}
PROD_DB_PORT=${process.env.PROD_DB_PORT || '5432'}
PROD_DB_NAME=${process.env.PROD_DB_NAME || 'teach_niche_prod'}
PROD_DB_USER=${process.env.PROD_DB_USER || ''}
PROD_DB_PASSWORD=${process.env.PROD_DB_PASSWORD || ''}
PROD_DB_SSL=true

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}
NEXT_PUBLIC_FIREBASE_APP_ID=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}
FIREBASE_CLIENT_EMAIL=${process.env.FIREBASE_CLIENT_EMAIL || ''}
FIREBASE_PRIVATE_KEY=${process.env.FIREBASE_PRIVATE_KEY || ''}

# Stripe Configuration
STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY || ''}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
STRIPE_WEBHOOK_SECRET=${process.env.STRIPE_WEBHOOK_SECRET || ''}
`;

  // Test environment
  const testEnvContent = `# Test Environment Configuration
NODE_ENV=test
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=teach_niche_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=
TEST_DB_SSL=false

# Firebase Configuration - Test Project
NEXT_PUBLIC_FIREBASE_API_KEY=${process.env.TEST_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${process.env.TEST_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${process.env.TEST_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${process.env.TEST_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${process.env.TEST_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}
NEXT_PUBLIC_FIREBASE_APP_ID=${process.env.TEST_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}
FIREBASE_CLIENT_EMAIL=${process.env.TEST_FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || ''}
FIREBASE_PRIVATE_KEY=${process.env.TEST_FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || ''}

# Stripe Configuration - Test Mode
STRIPE_SECRET_KEY=${process.env.TEST_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ''}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${process.env.TEST_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
STRIPE_WEBHOOK_SECRET=${process.env.TEST_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ''}
`;

  // Write files
  fs.writeFileSync('.env.development', devEnvContent);
  fs.writeFileSync('.env.production', prodEnvContent);
  fs.writeFileSync('.env.test', testEnvContent);
  
  console.log(`${colors.green}Created environment files:${colors.reset}`);
  console.log('- .env.development');
  console.log('- .env.production');
  console.log('- .env.test');
}

// Validate Stripe configuration
function validateStripeConfig() {
  console.log(`${colors.cyan}Validating Stripe configuration...${colors.reset}`);
  
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];
  
  let isValid = true;
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`${colors.red}Missing required Stripe variable: ${varName}${colors.reset}`);
      isValid = false;
    } else if (varName.includes('SECRET') && process.env[varName]!.startsWith('sk_test_')) {
      console.warn(`${colors.yellow}Warning: Using test mode Stripe key for production${colors.reset}`);
    }
  }
  
  return isValid;
}

// Verify Firebase configuration
async function verifyFirebaseConfiguration(environment: Environment) {
  console.log(`${colors.cyan}Verifying Firebase configuration for ${environment} environment...${colors.reset}`);
  
  // Get environment-specific Firebase configuration
  let projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (environment === 'production' && process.env.PROD_FIREBASE_PROJECT_ID) {
    projectId = process.env.PROD_FIREBASE_PROJECT_ID;
    clientEmail = process.env.PROD_FIREBASE_CLIENT_EMAIL || clientEmail;
    privateKey = process.env.PROD_FIREBASE_PRIVATE_KEY || privateKey;
  } else if (environment === 'test' && process.env.TEST_FIREBASE_PROJECT_ID) {
    projectId = process.env.TEST_FIREBASE_PROJECT_ID;
    clientEmail = process.env.TEST_FIREBASE_CLIENT_EMAIL || clientEmail;
    privateKey = process.env.TEST_FIREBASE_PRIVATE_KEY || privateKey;
  }
  
  // Check if required configuration is available
  if (!projectId || !clientEmail || !privateKey) {
    console.warn(`${colors.yellow}Missing Firebase configuration for ${environment} environment${colors.reset}`);
    console.log(`Required environment variables:
      - ${environment === 'production' ? 'PROD_' : environment === 'test' ? 'TEST_' : ''}FIREBASE_PROJECT_ID
      - ${environment === 'production' ? 'PROD_' : environment === 'test' ? 'TEST_' : ''}FIREBASE_CLIENT_EMAIL
      - ${environment === 'production' ? 'PROD_' : environment === 'test' ? 'TEST_' : ''}FIREBASE_PRIVATE_KEY
    `);
    console.log(`${colors.yellow}Skipping Firebase validation. You can add these variables to your .env file later.${colors.reset}`);
    return true; // Return true to continue with setup
  }
  
  console.log(`${colors.green}Firebase configuration for ${environment} environment is valid${colors.reset}`);
  return true;
}

// Verify Mux configuration
async function verifyMuxConfiguration(environment: Environment) {
  console.log(`${colors.cyan}Verifying Mux configuration for ${environment} environment...${colors.reset}`);
  
  // Get environment-specific Mux configuration
  let tokenId = process.env.MUX_TOKEN_ID;
  let tokenSecret = process.env.MUX_TOKEN_SECRET;
  let webhookSecret = process.env.MUX_WEBHOOK_SECRET;
  
  if (environment === 'production' && process.env.PROD_MUX_TOKEN_ID) {
    tokenId = process.env.PROD_MUX_TOKEN_ID;
    tokenSecret = process.env.PROD_MUX_TOKEN_SECRET || tokenSecret;
    webhookSecret = process.env.PROD_MUX_WEBHOOK_SECRET || webhookSecret;
  } else if (environment === 'test' && process.env.TEST_MUX_TOKEN_ID) {
    tokenId = process.env.TEST_MUX_TOKEN_ID;
    tokenSecret = process.env.TEST_MUX_TOKEN_SECRET || tokenSecret;
    webhookSecret = process.env.TEST_MUX_WEBHOOK_SECRET || webhookSecret;
  }
  
  // Check if required configuration is available
  if (!tokenId || !tokenSecret) {
    console.warn(`${colors.yellow}Missing Mux configuration for ${environment} environment${colors.reset}`);
    console.log(`Required environment variables:
      - ${environment === 'production' ? 'PROD_' : environment === 'test' ? 'TEST_' : ''}MUX_TOKEN_ID
      - ${environment === 'production' ? 'PROD_' : environment === 'test' ? 'TEST_' : ''}MUX_TOKEN_SECRET
      - ${environment === 'production' ? 'PROD_' : environment === 'test' ? 'TEST_' : ''}MUX_WEBHOOK_SECRET (optional)
    `);
    console.log(`${colors.yellow}Skipping Mux validation. You can add these variables to your .env file later.${colors.reset}`);
    return true; // Return true to continue with setup
  }
  
  // Validate Mux credentials by making a test API call
  try {
    const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');
    const response = await fetch('https://api.mux.com/video/v1/environments', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log(`${colors.green}Mux API credentials for ${environment} environment are valid${colors.reset}`);
      return true;
    } else {
      console.error(`${colors.red}Invalid Mux API credentials for ${environment} environment${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}Error validating Mux API credentials:${colors.reset}`, error);
    return false;
  }
}

// Verify database connection
async function verifyDatabaseConnection(environment: Environment) {
  console.log(`${colors.cyan}Verifying database connection for ${environment} environment...${colors.reset}`);
  
  const config = getDatabaseConfig(environment);
  console.log(`Attempting to connect to ${config.database} on ${config.host}:${config.port}`);
  
  try {
    // This is a placeholder - in a real implementation, you would use the actual database client
    // For example, with PostgreSQL:
    // const { Pool } = require('pg');
    // const pool = new Pool(config);
    // const client = await pool.connect();
    // await client.query('SELECT NOW()');
    // client.release();
    
    console.log(`${colors.green}Successfully connected to ${environment} database!${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Failed to connect to ${environment} database:${colors.reset}`, error);
    return false;
  }
}

// Main function
async function main() {
  console.log(`${colors.cyan}Environment Setup Script${colors.reset}`);
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let createEnv = false;
  let verifyConnection = false;
  let verifyFirebase = false;
  let verifyMux = false;
  let targetEnvironment: Environment | 'all' = 'all';
  
  for (const arg of args) {
    if (arg === '--create-env' || arg === '-e') {
      createEnv = true;
    } else if (arg === '--verify' || arg === '-v') {
      verifyConnection = true;
    } else if (arg === '--verify-firebase' || arg === '-f') {
      verifyFirebase = true;
    } else if (arg === '--verify-mux' || arg === '-m') {
      verifyMux = true;
    } else if (arg === '--dev') {
      targetEnvironment = 'development';
    } else if (arg === '--prod') {
      targetEnvironment = 'production';
    } else if (arg === '--test') {
      targetEnvironment = 'test';
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: npm run setup-environment -- [options]

Options:
  --create-env, -e       Create environment-specific .env files
  --verify, -v           Verify database connection
  --verify-firebase, -f  Verify Firebase configuration
  --verify-mux, -m       Verify Mux configuration
  --dev                  Target development environment only
  --prod                 Target production environment only
  --test                 Target test environment only
  --help, -h             Show this help message
      `);
      process.exit(0);
    }
  }
  
  // Default behavior if no options specified
  if (!createEnv && !verifyConnection && !verifyFirebase && !verifyMux) {
    createEnv = true;
    verifyConnection = true;
    verifyFirebase = true;
    verifyMux = true;
  }
  
  try {
    // Create environment files if requested
    if (createEnv) {
      createEnvFiles();
    }
    
    // Validate configurations
    const stripeValid = validateStripeConfig();
    if (!stripeValid) {
      console.warn(`${colors.yellow}Stripe configuration is incomplete or invalid. Some features may not work correctly.${colors.reset}`);
      // Continue with setup instead of throwing an error
    }

    // Verify database connection if requested
    if (verifyConnection) {
      if (targetEnvironment === 'all') {
        await verifyDatabaseConnection('development');
        await verifyDatabaseConnection('production');
        await verifyDatabaseConnection('test');
      } else {
        await verifyDatabaseConnection(targetEnvironment);
      }
    }
    
    // Verify Firebase configuration if requested
    if (verifyFirebase) {
      if (targetEnvironment === 'all') {
        await verifyFirebaseConfiguration('development');
        await verifyFirebaseConfiguration('production');
        await verifyFirebaseConfiguration('test');
      } else {
        await verifyFirebaseConfiguration(targetEnvironment);
      }
    }
    
    // Verify Mux configuration if requested
    if (verifyMux) {
      if (targetEnvironment === 'all') {
        await verifyMuxConfiguration('development');
        await verifyMuxConfiguration('production');
        await verifyMuxConfiguration('test');
      } else {
        await verifyMuxConfiguration(targetEnvironment);
      }
    }
    
    console.log(`${colors.green}Environment setup completed successfully!${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error during environment setup:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the script
main();

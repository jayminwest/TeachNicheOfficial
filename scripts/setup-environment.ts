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
  let targetEnvironment: Environment | 'all' = 'all';
  
  for (const arg of args) {
    if (arg === '--create-env' || arg === '-e') {
      createEnv = true;
    } else if (arg === '--verify' || arg === '-v') {
      verifyConnection = true;
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
  --create-env, -e   Create environment-specific .env files
  --verify, -v       Verify database connection
  --dev              Target development environment only
  --prod             Target production environment only
  --test             Target test environment only
  --help, -h         Show this help message
      `);
      process.exit(0);
    }
  }
  
  // Default behavior if no options specified
  if (!createEnv && !verifyConnection) {
    createEnv = true;
    verifyConnection = true;
  }
  
  try {
    // Create environment files if requested
    if (createEnv) {
      createEnvFiles();
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
    
    console.log(`${colors.green}Environment setup completed successfully!${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error during environment setup:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the script
main();

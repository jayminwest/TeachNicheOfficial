#!/usr/bin/env node

/**
 * Script to update package.json dependencies
 * 
 * This script:
 * 1. Removes Supabase dependencies
 * 2. Adds or updates GCP dependencies
 * 3. Updates the package.json file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');

// Dependencies to remove (Supabase)
const dependenciesToRemove = [
  '@supabase/auth-helpers-nextjs',
  '@supabase/auth-helpers-react',
  '@supabase/supabase-js'
];

// Dependencies to add or update (GCP)
const dependenciesToAdd = {
  '@google-cloud/storage': '^7.7.0',
  'firebase': '^10.7.1',
  'firebase-admin': '^12.0.0',
  'googleapis': '^129.0.0',
  'google-auth-library': '^9.4.1',
  'pg': '^8.11.3',
  '@types/pg': '^8.10.9'
};

async function updatePackageJson() {
  console.log('Updating package.json...');
  
  try {
    // Read package.json
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Create backup
    const backupPath = `${packageJsonPath}.bak`;
    fs.writeFileSync(backupPath, packageJsonContent, 'utf-8');
    console.log(`Created backup at ${backupPath}`);
    
    // Remove Supabase dependencies
    let removedCount = 0;
    for (const dep of dependenciesToRemove) {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        delete packageJson.dependencies[dep];
        removedCount++;
        console.log(`Removed dependency: ${dep}`);
      }
      
      if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
        delete packageJson.devDependencies[dep];
        removedCount++;
        console.log(`Removed dev dependency: ${dep}`);
      }
    }
    
    // Add or update GCP dependencies
    let addedCount = 0;
    let updatedCount = 0;
    
    for (const [dep, version] of Object.entries(dependenciesToAdd)) {
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      
      if (packageJson.dependencies[dep]) {
        const currentVersion = packageJson.dependencies[dep];
        packageJson.dependencies[dep] = version;
        updatedCount++;
        console.log(`Updated dependency: ${dep} (${currentVersion} -> ${version})`);
      } else {
        packageJson.dependencies[dep] = version;
        addedCount++;
        console.log(`Added dependency: ${dep} @ ${version}`);
      }
    }
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    
    console.log('\nPackage.json updated successfully:');
    console.log(`- Removed ${removedCount} Supabase dependencies`);
    console.log(`- Added ${addedCount} new GCP dependencies`);
    console.log(`- Updated ${updatedCount} existing dependencies`);
    console.log('\nRun npm install to apply changes');
    
  } catch (error) {
    console.error('Error updating package.json:', error);
    process.exit(1);
  }
}

updatePackageJson().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

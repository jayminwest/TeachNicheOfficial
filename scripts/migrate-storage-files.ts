/**
 * Storage Migration Script
 * 
 * This script migrates files from Supabase Storage to Firebase Storage.
 * It downloads files from Supabase and uploads them to Firebase with the same path structure.
 * 
 * Usage:
 * 1. Set up environment variables for both Supabase and Firebase
 * 2. Run with: npx ts-node scripts/migrate-storage-files.ts
 */

import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseBucket = 'media';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseKey);
const firebaseApp = initializeApp(firebaseConfig);
const firebaseStorage = getStorage(firebaseApp);

// Create temp directory
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storage-migration-'));

// Storage folders to migrate
const storageFolders = [
  'profiles',
  'lessons',
  'uploads'
];

// Main migration function
async function migrateFiles() {
  console.log('Starting storage migration...');
  
  try {
    // Process each folder
    for (const folder of storageFolders) {
      await migrateFolder(folder);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Migrate a specific folder
async function migrateFolder(folderPath: string) {
  console.log(`Migrating folder: ${folderPath}`);
  
  try {
    // List all files in the folder
    const { data: files, error } = await supabase.storage.from(supabaseBucket).list(folderPath);
    
    if (error) {
      throw error;
    }
    
    if (!files || files.length === 0) {
      console.log(`No files found in folder: ${folderPath}`);
      return;
    }
    
    console.log(`Found ${files.length} files/folders in: ${folderPath}`);
    
    // Process each file/folder
    for (const item of files) {
      const itemPath = path.join(folderPath, item.name);
      
      if (item.id) {
        // It's a file
        await migrateFile(itemPath);
      } else {
        // It's a folder
        await migrateFolder(itemPath);
      }
    }
  } catch (error) {
    console.error(`Error migrating folder ${folderPath}:`, error);
  }
}

// Migrate a specific file
async function migrateFile(filePath: string) {
  console.log(`Migrating file: ${filePath}`);
  
  try {
    // Download file from Supabase
    const { data, error } = await supabase.storage.from(supabaseBucket)
      .download(filePath);
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      console.log(`No data found for file: ${filePath}`);
      return;
    }
    
    // Save to temp file
    const tempFilePath = path.join(tempDir, path.basename(filePath));
    fs.writeFileSync(tempFilePath, Buffer.from(await data.arrayBuffer()));
    
    // Upload to Firebase Storage
    const fileBuffer = fs.readFileSync(tempFilePath);
    const storageRef = ref(firebaseStorage, filePath);
    await uploadBytes(storageRef, fileBuffer);
    
    // Verify upload
    const downloadUrl = await getDownloadURL(storageRef);
    
    console.log(`✅ Successfully migrated: ${filePath}`);
    console.log(`   New URL: ${downloadUrl}`);
  } catch (error) {
    console.error(`❌ Failed to migrate ${filePath}:`, error);
  }
}

// Run the migration
migrateFiles().catch(console.error);

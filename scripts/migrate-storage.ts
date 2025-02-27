import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { firebaseConfig } from '../app/lib/firebase';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Firebase setup
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Storage buckets to migrate
const buckets = [
  'avatars',
  'thumbnails',
  'videos',
  // Add other buckets as needed
];

// Temporary directory for downloaded files
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

async function downloadFile(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));
}

async function migrateBucket(bucketName: string) {
  console.log(`Migrating bucket: ${bucketName}`);
  
  // List all files in the Supabase bucket
  const { data: files, error } = await supabase.storage.from(bucketName).list();
  
  if (error) {
    console.error(`Error listing files in bucket ${bucketName}:`, error);
    return false;
  }
  
  if (!files || files.length === 0) {
    console.log(`No files found in bucket ${bucketName}`);
    return true;
  }
  
  console.log(`Found ${files.length} files in bucket ${bucketName}`);
  
  // Migrate each file
  for (const file of files) {
    try {
      // Skip folders
      if (file.id === null) continue;
      
      console.log(`Migrating file: ${file.name}`);
      
      // Get public URL from Supabase
      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(file.name);
      
      // Download the file to temp directory
      const tempFilePath = path.join(tempDir, file.name);
      await downloadFile(publicUrl, tempFilePath);
      
      // Upload to Firebase Storage
      const fileBuffer = fs.readFileSync(tempFilePath);
      const storageRef = ref(storage, `${bucketName}/${file.name}`);
      await uploadBytes(storageRef, fileBuffer);
      
      // Verify upload
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`File migrated successfully: ${downloadURL}`);
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    } catch (err) {
      console.error(`Error migrating file ${file.name}:`, err);
      return false;
    }
  }
  
  return true;
}

async function migrateStorage() {
  console.log('Starting storage migration...');
  
  for (const bucket of buckets) {
    const success = await migrateBucket(bucket);
    if (!success) {
      console.error(`Migration failed for bucket ${bucket}`);
      process.exit(1);
    }
  }
  
  console.log('Storage migration completed successfully');
  
  // Clean up temp directory
  fs.rmdirSync(tempDir, { recursive: true });
  
  process.exit(0);
}

migrateStorage().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

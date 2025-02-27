import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

console.log('Firebase configuration:', {
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

if (!firebaseConfig.projectId || !firebaseConfig.storageBucket) {
  console.error('Missing Firebase configuration. Please check your .env.local file.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Create a test file
const testFilePath = path.join(__dirname, 'test-file.txt');
fs.writeFileSync(testFilePath, 'This is a test file for Firebase Storage.');

async function testFirebaseStorage() {
  console.log('Testing Firebase Storage...');
  
  try {
    // Test file upload
    console.log('Uploading test file...');
    const testFileRef = ref(storage, 'test/test-file.txt');
    const fileData = fs.readFileSync(testFilePath);
    
    const uploadResult = await uploadBytes(testFileRef, fileData);
    console.log('File uploaded successfully:', uploadResult.metadata.name);
    
    // Test file download URL
    console.log('Getting download URL...');
    const downloadURL = await getDownloadURL(testFileRef);
    console.log('Download URL:', downloadURL);
    
    // Test file deletion
    console.log('Deleting test file...');
    await deleteObject(testFileRef);
    console.log('File deleted successfully');
    
    console.log('Firebase Storage tests completed successfully');
  } catch (error: any) {
    console.error('Firebase Storage test failed:', error);
    
    // Provide more detailed error information
    if (error.code === 'storage/unknown') {
      console.error('Storage bucket not found or not accessible.');
      console.error('Please check:');
      console.error('1. The storage bucket name is correct in your .env.local file');
      console.error('2. The Firebase project has a storage bucket created');
      console.error('3. The storage rules allow test file uploads');
    }
    
    process.exit(1);
  } finally {
    // Clean up local test file
    fs.unlinkSync(testFilePath);
  }
  
  process.exit(0);
}

testFirebaseStorage().catch(err => {
  console.error('Firebase Storage test failed:', err);
  process.exit(1);
});
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

console.log('Firebase configuration:', {
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

if (!firebaseConfig.projectId || !firebaseConfig.storageBucket) {
  console.error('Missing Firebase configuration. Please check your .env.local file.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Create a test file
const testFilePath = path.join(__dirname, 'test-file.txt');
fs.writeFileSync(testFilePath, 'This is a test file for Firebase Storage.');

async function testFirebaseStorage() {
  console.log('Testing Firebase Storage...');
  
  try {
    // Test file upload
    console.log('Uploading test file...');
    const testFileRef = ref(storage, 'test/test-file.txt');
    const fileData = fs.readFileSync(testFilePath);
    
    const uploadResult = await uploadBytes(testFileRef, fileData);
    console.log('File uploaded successfully:', uploadResult.metadata.name);
    
    // Test file download URL
    console.log('Getting download URL...');
    const downloadURL = await getDownloadURL(testFileRef);
    console.log('Download URL:', downloadURL);
    
    // Test file deletion
    console.log('Deleting test file...');
    await deleteObject(testFileRef);
    console.log('File deleted successfully');
    
    console.log('Firebase Storage tests completed successfully');
  } catch (error: any) {
    console.error('Firebase Storage test failed:', error);
    
    // Provide more detailed error information
    if (error.code === 'storage/unknown') {
      console.error('Storage bucket not found or not accessible.');
      console.error('Please check:');
      console.error('1. The storage bucket name is correct in your .env.local file');
      console.error('2. The Firebase project has a storage bucket created');
      console.error('3. The storage rules allow test file uploads');
    }
    
    process.exit(1);
  } finally {
    // Clean up local test file
    fs.unlinkSync(testFilePath);
  }
  
  process.exit(0);
}

testFirebaseStorage().catch(err => {
  console.error('Firebase Storage test failed:', err);
  process.exit(1);
});

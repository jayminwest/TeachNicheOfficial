// Firebase app should be initialized only once
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
import dotenv from 'dotenv';
import { FirebaseStorage } from '../app/services/storage/firebase-storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFirebaseStorage() {
  console.log('Testing Firebase Storage service...');
  
  try {
    // Create storage service instance
    const storage = new FirebaseStorage();
    
    // Create a test file
    const testDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testFilePath = path.join(testDir, 'test-file.txt');
    const testContent = `Test file content - ${new Date().toISOString()}`;
    fs.writeFileSync(testFilePath, testContent);
    
    console.log('\nCreated test file:', testFilePath);
    
    // Upload the file
    console.log('\nUploading file to Firebase Storage...');
    const storagePath = 'test/test-file.txt';
    const fileBuffer = fs.readFileSync(testFilePath);
    const downloadUrl = await storage.uploadFile(storagePath, fileBuffer);
    
    console.log('File uploaded successfully!');
    console.log('Download URL:', downloadUrl);
    
    // Get the file URL
    console.log('\nGetting file URL...');
    const fileUrl = await storage.getFileUrl(storagePath);
    console.log('File URL:', fileUrl);
    
    // Delete the file
    console.log('\nDeleting file from Firebase Storage...');
    await storage.deleteFile(storagePath);
    console.log('File deleted successfully!');
    
    // Clean up local test file
    fs.unlinkSync(testFilePath);
    console.log('\nLocal test file cleaned up');
    
    console.log('\n✅ Firebase Storage tests completed successfully!');
  } catch (error) {
    console.error('Error testing Firebase Storage:', error);
    process.exit(1);
  }
}

testFirebaseStorage().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

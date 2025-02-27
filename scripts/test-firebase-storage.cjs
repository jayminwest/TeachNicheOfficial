/**
 * Firebase Storage Test Script (CommonJS version)
 * 
 * This script tests the Firebase Storage implementation by:
 * 1. Uploading a test file
 * 2. Getting the URL of the uploaded file
 * 3. Deleting the test file
 * 
 * Usage: node scripts/test-firebase-storage.cjs
 */

// Initialize Firebase directly in this script to avoid import issues
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'teachnicheofficial',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'teachnicheofficial.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verify Firebase configuration
console.log('Verifying Firebase configuration...');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Storage Bucket:', firebaseConfig.storageBucket);
console.log('Auth Domain:', firebaseConfig.authDomain);
console.log('API Key is set:', !!firebaseConfig.apiKey);
console.log('App ID is set:', !!firebaseConfig.appId);
console.log('Messaging Sender ID is set:', !!firebaseConfig.messagingSenderId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

console.log('Firebase initialized with project:', firebaseConfig.projectId);
console.log('Using storage bucket:', firebaseConfig.storageBucket);

// Check if storage bucket is properly configured
if (!firebaseConfig.storageBucket) {
  console.error('ERROR: Storage bucket is not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.');
  process.exit(1);
}

// Check if we're using the default bucket name
if (firebaseConfig.storageBucket === `${firebaseConfig.projectId}.appspot.com`) {
  console.log('Using default Firebase Storage bucket name.');
  console.log('Make sure the Storage service is enabled in the Firebase Console.');
  console.log('Visit: https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/storage');
}

class FirebaseStorage {
  async uploadFile(path, file) {
    try {
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, path);
      
      // In Node.js environment, we can't use the browser's Blob
      // So we'll just pass the Buffer directly to uploadBytes
      let fileData = file;
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, fileData);
      
      // Get the download URL
      return getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading file to Firebase Storage:', error);
      console.error('Storage bucket:', firebaseConfig.storageBucket);
      console.error('File path:', path);
      console.error('File size:', file.length, 'bytes');
      
      // Check if the error is related to permissions or configuration
      if (error.code === 'storage/unauthorized') {
        console.error('ERROR: Unauthorized access. Check Firebase Storage rules and authentication.');
      } else if (error.code === 'storage/unknown' && error.status_ === 404) {
        console.error('ERROR: Storage bucket not found or not accessible. Check your storage bucket configuration.');
        console.error('Make sure the bucket exists and is properly configured in Firebase console.');
      }
      
      throw error;
    }
  }
  
  async getFileUrl(path) {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting file URL from Firebase Storage:', error);
      throw error;
    }
  }
  
  async deleteFile(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file from Firebase Storage:', error);
      throw error;
    }
  }
}
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testFirebaseStorage() {
  console.log('Testing Firebase Storage implementation...');
  
  // Create a test file
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'firebase-storage-test-'));
  const testFilePath = path.join(tempDir, 'test-file.txt');
  fs.writeFileSync(testFilePath, 'This is a test file for Firebase Storage.');
  
  // Create storage service instance
  const storageService = new FirebaseStorage();
  
  try {
    // 1. Upload test file
    console.log('1. Testing file upload...');
    const testFileBuffer = fs.readFileSync(testFilePath);
    const uploadPath = `test/firebase-storage-test-${Date.now()}.txt`;
    const fileUrl = await storageService.uploadFile(uploadPath, testFileBuffer);
    console.log(`✅ File uploaded successfully: ${fileUrl}`);
    
    // 2. Get file URL
    console.log('2. Testing getFileUrl...');
    const retrievedUrl = await storageService.getFileUrl(uploadPath);
    console.log(`✅ File URL retrieved successfully: ${retrievedUrl}`);
    
    // 3. Delete file
    console.log('3. Testing file deletion...');
    await storageService.deleteFile(uploadPath);
    console.log('✅ File deleted successfully');
    
    console.log('All tests passed! Firebase Storage implementation is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Run the test
testFirebaseStorage();

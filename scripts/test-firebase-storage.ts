/**
 * Firebase Storage Test Script
 * 
 * This script tests the Firebase Storage implementation by:
 * 1. Uploading a test file
 * 2. Getting the URL of the uploaded file
 * 3. Deleting the test file
 * 
 * Usage: npx ts-node scripts/test-firebase-storage.ts
 */

// Import using the correct path without .ts extension
import { FirebaseStorage } from '../app/services/storage/firebase-storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

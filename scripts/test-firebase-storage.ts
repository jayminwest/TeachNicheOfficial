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

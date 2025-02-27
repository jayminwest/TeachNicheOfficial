#!/usr/bin/env tsx

/**
 * Integration tests for GCP services
 * 
 * This script tests the integration between our service abstraction layers
 * and the actual GCP implementations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const dotenvPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(dotenvPath)) {
  const dotenv = await import('dotenv');
  dotenv.config({ path: dotenvPath });
}

// Import services dynamically (ESM compatible)
const { CloudSqlDatabase } = await import('../app/services/database/cloud-sql.js');
const { FirebaseStorage } = await import('../app/services/storage/firebase-storage.js');
const { GoogleWorkspaceEmail } = await import('../app/services/email/google-workspace.js');

// Test database service
async function testDatabaseService() {
  console.log('\n--- Testing Database Service ---');
  const db = new CloudSqlDatabase();
  
  try {
    // Test connection
    console.log('Testing database connection...');
    const result = await db.query('SELECT NOW() as current_time');
    console.log(`Database connection successful. Current time: ${result.rows[0].current_time}`);
    
    // Test table access
    console.log('Testing table access...');
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // Test CRUD operations
    console.log('Testing CRUD operations...');
    const testId = uuidv4();
    const testName = 'Integration Test Category';
    
    // Create
    await db.query(`
      INSERT INTO categories (id, name, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
    `, [testId, testName]);
    console.log(`Created test category with ID: ${testId}`);
    
    // Read
    const readResult = await db.query(`
      SELECT * FROM categories WHERE id = $1
    `, [testId]);
    console.log(`Read test category: ${JSON.stringify(readResult.rows[0])}`);
    
    // Update
    const updatedName = `${testName} Updated`;
    await db.query(`
      UPDATE categories SET name = $1, updated_at = NOW() WHERE id = $2
    `, [updatedName, testId]);
    console.log(`Updated test category name to: ${updatedName}`);
    
    // Verify update
    const verifyResult = await db.query(`
      SELECT * FROM categories WHERE id = $1
    `, [testId]);
    console.log(`Verified update: ${JSON.stringify(verifyResult.rows[0])}`);
    
    // Delete
    await db.query(`
      DELETE FROM categories WHERE id = $1
    `, [testId]);
    console.log(`Deleted test category with ID: ${testId}`);
    
    // Verify deletion
    const deleteVerifyResult = await db.query(`
      SELECT COUNT(*) FROM categories WHERE id = $1
    `, [testId]);
    console.log(`Verified deletion: ${deleteVerifyResult.rows[0].count} rows found`);
    
    console.log('Database service tests completed successfully');
    return true;
  } catch (error) {
    console.error('Database service test failed:', error);
    return false;
  } finally {
    await db.close();
  }
}

// Test storage service
async function testStorageService() {
  console.log('\n--- Testing Storage Service ---');
  const storage = new FirebaseStorage();
  const testFilePath = 'test/integration-test.txt';
  const testFileContent = `Integration test file content ${new Date().toISOString()}`;
  
  try {
    // Create a test file
    console.log(`Creating test file at ${testFilePath}...`);
    const tempFilePath = path.join(__dirname, 'temp-test-file.txt');
    fs.writeFileSync(tempFilePath, testFileContent);
    
    // Upload the file
    console.log('Uploading test file...');
    const fileBuffer = fs.readFileSync(tempFilePath);
    const uploadUrl = await storage.uploadFile(testFilePath, fileBuffer);
    console.log(`File uploaded successfully. URL: ${uploadUrl}`);
    
    // Get file URL
    console.log('Getting file URL...');
    const fileUrl = await storage.getFileUrl(testFilePath);
    console.log(`File URL: ${fileUrl}`);
    
    // Delete the file
    console.log('Deleting test file...');
    await storage.deleteFile(testFilePath);
    console.log('File deleted successfully');
    
    // Clean up local temp file
    fs.unlinkSync(tempFilePath);
    console.log('Local temp file cleaned up');
    
    console.log('Storage service tests completed successfully');
    return true;
  } catch (error) {
    console.error('Storage service test failed:', error);
    return false;
  }
}

// Test email service
async function testEmailService() {
  console.log('\n--- Testing Email Service ---');
  const email = new GoogleWorkspaceEmail();
  
  try {
    // Only run this test if a test email is provided
    const testEmailTo = process.env.TEST_EMAIL;
    if (!testEmailTo) {
      console.log('Skipping email test. Set TEST_EMAIL environment variable to run this test.');
      return true;
    }
    
    // Test sending a basic email
    console.log(`Sending test email to ${testEmailTo}...`);
    const result = await email.sendEmail({
      to: testEmailTo,
      subject: 'Integration Test Email',
      text: `This is a test email sent at ${new Date().toISOString()}`,
      html: `<p>This is a <strong>test email</strong> sent at ${new Date().toISOString()}</p>`
    });
    
    console.log(`Email sent successfully: ${result}`);
    
    // Test welcome email template
    console.log('Testing welcome email template...');
    const welcomeResult = await email.sendWelcomeEmail(testEmailTo, 'Test User');
    console.log(`Welcome email sent successfully: ${welcomeResult}`);
    
    console.log('Email service tests completed successfully');
    return true;
  } catch (error) {
    console.error('Email service test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting integration tests for GCP services...');
  
  const results = {
    database: await testDatabaseService(),
    storage: await testStorageService(),
    email: await testEmailService()
  };
  
  console.log('\n--- Integration Test Results ---');
  console.log(`Database Service: ${results.database ? 'PASSED' : 'FAILED'}`);
  console.log(`Storage Service: ${results.storage ? 'PASSED' : 'FAILED'}`);
  console.log(`Email Service: ${results.email ? 'PASSED' : 'FAILED'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\nOverall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Unhandled error in integration tests:', error);
  process.exit(1);
});

/**
 * Test Firebase Compatibility Layer
 * 
 * This script tests the Firebase compatibility layer to ensure it works as expected
 * with code that was previously using Supabase.
 */

import { firebaseClient } from '../app/services/firebase-compat.js';

async function testFirebaseCompat() {
  console.log('Testing Firebase Compatibility Layer...');
  
  try {
    // Test Firestore operations
    console.log('\n--- Testing Firestore Operations ---');
    
    // Insert a test document
    console.log('Inserting test document...');
    const insertResult = await firebaseClient.from('test_collection').insert({
      name: 'Test User',
      email: 'test@example.com',
      created_at: new Date().toISOString()
    });
    
    if (insertResult.error) {
      throw new Error(`Insert failed: ${insertResult.error.message}`);
    }
    
    console.log('Insert successful:', insertResult.data);
    const docId = insertResult.data.id;
    
    // Query the document
    console.log('\nQuerying test document...');
    const queryResult = await firebaseClient.from('test_collection')
      .select()
      .eq('id', docId);
    
    if (queryResult.error) {
      throw new Error(`Query failed: ${queryResult.error.message}`);
    }
    
    console.log('Query successful:', queryResult.data);
    
    // Update the document
    console.log('\nUpdating test document...');
    const updateResult = await firebaseClient.from('test_collection')
      .update({ name: 'Updated Test User' }, { eq: ['id', docId] });
    
    if (updateResult.error) {
      throw new Error(`Update failed: ${updateResult.error.message}`);
    }
    
    console.log('Update successful');
    
    // Query again to verify update
    console.log('\nVerifying update...');
    const verifyResult = await firebaseClient.from('test_collection')
      .select()
      .eq('id', docId);
    
    if (verifyResult.error) {
      throw new Error(`Verification query failed: ${verifyResult.error.message}`);
    }
    
    console.log('Verification successful:', verifyResult.data);
    
    // Delete the document
    console.log('\nDeleting test document...');
    const deleteResult = await firebaseClient.from('test_collection')
      .delete({ eq: ['id', docId] });
    
    if (deleteResult.error) {
      throw new Error(`Delete failed: ${deleteResult.error.message}`);
    }
    
    console.log('Delete successful');
    
    // Test Storage operations
    console.log('\n--- Testing Storage Operations ---');
    
    // Create a test file (as a Blob)
    const testFile = new Blob(['Test file content'], { type: 'text/plain' });
    
    // Upload the file
    console.log('Uploading test file...');
    const uploadResult = await firebaseClient.storage
      .from('test-bucket')
      .upload('test-file.txt', testFile);
    
    if (uploadResult.error) {
      throw new Error(`Upload failed: ${uploadResult.error.message}`);
    }
    
    console.log('Upload successful:', uploadResult.data);
    
    // Get the public URL
    console.log('\nGetting public URL...');
    const urlResult = firebaseClient.storage
      .from('test-bucket')
      .getPublicUrl('test-file.txt');
    
    if (urlResult.error) {
      throw new Error(`Get URL failed: ${urlResult.error.message}`);
    }
    
    console.log('Public URL:', urlResult.data.publicUrl);
    
    // Delete the file
    console.log('\nDeleting test file...');
    const removeResult = await firebaseClient.storage
      .from('test-bucket')
      .remove(['test-file.txt']);
    
    if (removeResult.error) {
      throw new Error(`Remove failed: ${removeResult.error.message}`);
    }
    
    console.log('Delete successful');
    
    console.log('\nAll tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error instanceof Error ? error.message : JSON.stringify(error));
    process.exit(1);
  }
}

testFirebaseCompat();

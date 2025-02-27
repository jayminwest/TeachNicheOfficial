import { createEmailService } from '../app/services/email';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmailService() {
  console.log('Testing email service...');
  
  // Check for required environment variables
  const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    console.error('Please make sure these are set in your .env.local file');
    process.exit(1);
  }
  
  const emailService = createEmailService();
  
  // Test sending a welcome email
  const testEmail = process.env.TEST_EMAIL || 'your-test-email@example.com';
  
  if (testEmail === 'your-test-email@example.com') {
    console.warn('Using default test email. Set TEST_EMAIL in your .env.local for a real test.');
  }
  
  console.log(`Sending welcome email to ${testEmail}...`);
  
  try {
    const result = await emailService.sendWelcomeEmail(testEmail, 'Test User');
    
    if (result) {
      console.log(`✅ Welcome email sent successfully to ${testEmail}`);
    } else {
      console.error(`❌ Failed to send welcome email to ${testEmail}`);
      process.exit(1);
    }
    
    // Test sending a password reset email
    console.log(`Sending password reset email to ${testEmail}...`);
    const resetLink = 'https://teachniche.com/reset-password?token=test-token';
    const resetResult = await emailService.sendPasswordResetEmail(testEmail, resetLink);
    
    if (resetResult) {
      console.log(`✅ Password reset email sent successfully to ${testEmail}`);
    } else {
      console.error(`❌ Failed to send password reset email to ${testEmail}`);
      process.exit(1);
    }
    
    // Test sending a purchase confirmation email
    console.log(`Sending purchase confirmation email to ${testEmail}...`);
    const purchaseResult = await emailService.sendPurchaseConfirmation(testEmail, 'Test Lesson', 19.99);
    
    if (purchaseResult) {
      console.log(`✅ Purchase confirmation email sent successfully to ${testEmail}`);
    } else {
      console.error(`❌ Failed to send purchase confirmation email to ${testEmail}`);
      process.exit(1);
    }
    
    console.log('✅ Email service tests completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Email service test failed with error:', error);
    process.exit(1);
  }
}

testEmailService().catch(err => {
  console.error('❌ Email service test failed with unhandled error:', err);
  process.exit(1);
});

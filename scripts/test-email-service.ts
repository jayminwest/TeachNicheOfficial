import { createEmailService } from '../app/services/email';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmailService() {
  console.log('Testing email service...');
  
  const emailService = createEmailService();
  
  // Test sending a welcome email
  const testEmail = process.env.TEST_EMAIL || 'your-test-email@example.com';
  const result = await emailService.sendWelcomeEmail(testEmail, 'Test User');
  
  if (result) {
    console.log(`Welcome email sent successfully to ${testEmail}`);
  } else {
    console.error(`Failed to send welcome email to ${testEmail}`);
    process.exit(1);
  }
  
  console.log('Email service test completed successfully');
  process.exit(0);
}

testEmailService().catch(err => {
  console.error('Email service test failed:', err);
  process.exit(1);
});

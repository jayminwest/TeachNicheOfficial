import dotenv from 'dotenv';
import { GoogleWorkspaceEmail } from '../app/services/email/google-workspace';
import { EmailOptions } from '../app/services/email/interface';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

// Mock email service for testing when Google credentials aren't available
class MockEmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log(`[MOCK] Sending email to ${options.to}`);
    console.log(`[MOCK] Subject: ${options.subject}`);
    console.log(`[MOCK] Text: ${options.text?.substring(0, 50)}...`);
    return true;
  }
  
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Welcome to Teach Niche',
      text: `Hello ${name}, welcome to Teach Niche!`,
      html: `<h1>Welcome to Teach Niche</h1><p>Hello ${name},</p><p>We're excited to have you join us!</p>`
    });
  }
  
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Reset Your Password',
      text: `Click this link to reset your password: ${resetLink}`,
      html: `<h1>Reset Your Password</h1><p><a href="${resetLink}">Click here</a> to reset your password.</p>`
    });
  }
  
  async sendPurchaseConfirmation(to: string, lessonTitle: string, amount: number): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Purchase Confirmation',
      text: `Thank you for purchasing ${lessonTitle} for $${amount.toFixed(2)}`,
      html: `<h1>Purchase Confirmation</h1><p>Thank you for purchasing <strong>${lessonTitle}</strong> for $${amount.toFixed(2)}</p>`
    });
  }
}

function createEmailService() {
  // Check if we have the required Google credentials
  const hasGoogleCredentials = 
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_REDIRECT_URI && 
    process.env.GOOGLE_REFRESH_TOKEN;
  
  if (hasGoogleCredentials) {
    console.log('Using Google Workspace Email service');
    return new GoogleWorkspaceEmail();
  } else {
    console.log('Using Mock Email service (Google credentials not found)');
    return new MockEmailService();
  }
}

async function testEmailService() {
  console.log('Testing email service...');
  
  const emailService = createEmailService();
  
  // Test sending a welcome email
  const testEmail = process.env.TEST_EMAIL || process.argv[2] || 'your-test-email@example.com';
  
  if (testEmail === 'your-test-email@example.com') {
    console.warn('Using default test email. Set TEST_EMAIL in your .env.local or provide as command line argument for a real test.');
  }
  
  console.log(`\nSending welcome email to ${testEmail}...`);
  
  try {
    const result = await emailService.sendWelcomeEmail(testEmail, 'Test User');
    
    if (result) {
      console.log(`✅ Welcome email sent successfully to ${testEmail}`);
    } else {
      console.error(`❌ Failed to send welcome email to ${testEmail}`);
      process.exit(1);
    }
    
    // Test sending a password reset email
    console.log(`\nSending password reset email to ${testEmail}...`);
    const resetLink = 'https://teachniche.com/reset-password?token=test-token';
    const resetResult = await emailService.sendPasswordResetEmail(testEmail, resetLink);
    
    if (resetResult) {
      console.log(`✅ Password reset email sent successfully to ${testEmail}`);
    } else {
      console.error(`❌ Failed to send password reset email to ${testEmail}`);
      process.exit(1);
    }
    
    // Test sending a purchase confirmation email
    console.log(`\nSending purchase confirmation email to ${testEmail}...`);
    const purchaseResult = await emailService.sendPurchaseConfirmation(testEmail, 'Introduction to Kendama', 29.99);
    
    if (purchaseResult) {
      console.log(`✅ Purchase confirmation email sent successfully to ${testEmail}`);
    } else {
      console.error(`❌ Failed to send purchase confirmation email to ${testEmail}`);
      process.exit(1);
    }
    
    console.log('\n✅ Email service tests completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Email service test failed with error:', error);
    process.exit(1);
  }
}

testEmailService().catch(err => {
  console.error('❌ Email service test failed with unhandled error:', err);
  process.exit(1);
});

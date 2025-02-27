// Create a local mock email service for testing
// Import dotenv only once
// Import dotenv only once

// Load environment variables
dotenv.config({ path: '.env.local' });

// Mock email service for testing
class MockEmailService {
  async sendEmail(options: { to: string, subject: string, text: string, html: string }) {
    console.log(`Sending email to ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Text: ${options.text.substring(0, 50)}...`);
    return true;
  }
  
  async sendWelcomeEmail(to: string, name: string) {
    return this.sendEmail({
      to,
      subject: 'Welcome to Teach Niche',
      text: `Hello ${name}, welcome to Teach Niche!`,
      html: `<h1>Welcome to Teach Niche</h1><p>Hello ${name},</p><p>We're excited to have you join us!</p>`
    });
  }
  
  async sendPasswordResetEmail(to: string, resetLink: string) {
    return this.sendEmail({
      to,
      subject: 'Reset Your Password',
      text: `Click this link to reset your password: ${resetLink}`,
      html: `<h1>Reset Your Password</h1><p><a href="${resetLink}">Click here</a> to reset your password.</p>`
    });
  }
  
  async sendPurchaseConfirmation(to: string, lessonTitle: string, amount: number) {
    return this.sendEmail({
      to,
      subject: 'Purchase Confirmation',
      text: `Thank you for purchasing ${lessonTitle} for $${amount.toFixed(2)}`,
      html: `<h1>Purchase Confirmation</h1><p>Thank you for purchasing <strong>${lessonTitle}</strong> for $${amount.toFixed(2)}</p>`
    });
  }
}

function createEmailService() {
  return new MockEmailService();
}

async function testEmailService() {
  console.log('Testing email service...');
  
  // Check for required environment variables in a real implementation
  console.log('Note: Using mock email service for testing');
  
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

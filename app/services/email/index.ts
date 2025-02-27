import { GoogleWorkspaceEmail } from './google-workspace';

// For now, we only have one email implementation
export const emailService = new GoogleWorkspaceEmail();
import { EmailService } from './interface';
import { GoogleWorkspaceEmail } from './google-workspace';

// Factory function to create the appropriate email service
export function createEmailService(): EmailService {
  return new GoogleWorkspaceEmail();
}

// Export the interface for type checking
export type { EmailService, EmailOptions } from './interface';
import { EmailService } from './interface';
import { GoogleWorkspaceEmail } from './google-workspace';

// Factory function to create the appropriate email service
export function createEmailService(): EmailService {
  return new GoogleWorkspaceEmail();
}

// Export the interface for type checking
export type { EmailService, EmailOptions } from './interface';
import { GoogleWorkspaceEmail } from './google-workspace';

// Interface for email service
export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<boolean>;
  sendWelcomeEmail(to: string, name: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean>;
  sendPurchaseConfirmation(to: string, lessonTitle: string, amount: number): Promise<boolean>;
}

// Factory function to create the appropriate email service
export function createEmailService(): EmailService {
  // Use environment variable to determine which implementation to use
  const useGcp = process.env.USE_GCP_SERVICES === 'true';
  
  if (useGcp) {
    return new GoogleWorkspaceEmail();
  } else {
    // Fallback to a mock implementation for testing
    return new MockEmailService();
  }
}

// Mock email service for testing
class MockEmailService implements EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log(`[MOCK] Sending email to ${options.to}`);
    console.log(`[MOCK] Subject: ${options.subject}`);
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

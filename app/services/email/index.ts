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

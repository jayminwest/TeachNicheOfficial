export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<boolean>;
  sendWelcomeEmail(to: string, name: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean>;
  sendPurchaseConfirmation(to: string, lessonTitle: string, amount: number): Promise<boolean>;
}

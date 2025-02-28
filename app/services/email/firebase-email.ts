import { EmailOptions, EmailService } from './interface';
import admin from 'firebase-admin';
import { getApp } from 'firebase-admin/app';

export class FirebaseEmail implements EmailService {
  private app: admin.app.App;

  constructor() {
    try {
      this.app = getApp() as admin.app.App;
    } catch {
      // Initialize a new app if one doesn't exist
      this.app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      console.log(`Sending email to ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Welcome to Teach Niche!',
      text: `Hello ${name},\n\nWelcome to Teach Niche! We're excited to have you join our community of experts and learners.\n\nBest regards,\nThe Teach Niche Team`,
      html: `<p>Hello ${name},</p><p>Welcome to Teach Niche! We're excited to have you join our community of experts and learners.</p><p>Best regards,<br>The Teach Niche Team</p>`
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Reset Your Teach Niche Password',
      text: `Hello,\n\nYou requested to reset your password. Please click the following link to reset your password: ${resetLink}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Teach Niche Team`,
      html: `<p>Hello,</p><p>You requested to reset your password. Please <a href="${resetLink}">click here</a> to reset your password.</p><p>If you didn't request this, please ignore this email.</p><p>Best regards,<br>The Teach Niche Team</p>`
    });
  }

  async sendPurchaseConfirmation(to: string, lessonTitle: string, amount: number): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Your Purchase: ${lessonTitle}`,
      text: `Hello,\n\nThank you for your purchase of "${lessonTitle}" for $${amount.toFixed(2)}.\n\nYou can access your lesson from your dashboard.\n\nBest regards,\nThe Teach Niche Team`,
      html: `<p>Hello,</p><p>Thank you for your purchase of "${lessonTitle}" for $${amount.toFixed(2)}.</p><p>You can access your lesson from your dashboard.</p><p>Best regards,<br>The Teach Niche Team</p>`
    });
  }
}

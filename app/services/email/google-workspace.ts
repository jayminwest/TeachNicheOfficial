import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { EmailOptions, EmailService } from './interface';

export class GoogleWorkspaceEmail implements EmailService {
  private oauth2Client: OAuth2Client;
  
  constructor() {
    // Initialize OAuth2 client with credentials from environment variables
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      // Format recipients
      const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
      
      // Create email content
      const contentType = options.isHtml ? 'text/html' : 'text/plain';
      const emailLines = [
        `To: ${to}`,
        `Subject: ${options.subject}`,
        'Content-Type: ' + contentType + '; charset=utf-8',
        '',
        options.body
      ];
      
      if (options.replyTo) {
        emailLines.splice(2, 0, `Reply-To: ${options.replyTo}`);
      }
      
      // Encode the email
      const email = Buffer.from(emailLines.join('\r\n')).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      // Send the email
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: email
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
}

export const emailService = new GoogleWorkspaceEmail();
import { EmailOptions, EmailService } from './interface';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GoogleWorkspaceEmail implements EmailService {
  private oauth2Client: OAuth2Client;
  private gmail: any;
  
  constructor() {
    // Create OAuth2 client
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    // Set credentials
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    
    // Initialize Gmail API
    this.gmail = google.gmail({
      version: 'v1',
      auth: this.oauth2Client
    });
  }
  
  private encodeMessage(message: string) {
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  
  private createEmail(options: EmailOptions) {
    const boundary = 'boundary';
    const nl = '\n';
    
    let message = '';
    message += `From: ${options.from}${nl}`;
    message += `To: ${options.to}${nl}`;
    message += `Subject: ${options.subject}${nl}`;
    message += `MIME-Version: 1.0${nl}`;
    message += `Content-Type: multipart/alternative; boundary=${boundary}${nl}${nl}`;
    
    // Text part
    message += `--${boundary}${nl}`;
    message += `Content-Type: text/plain; charset=UTF-8${nl}${nl}`;
    message += `${options.text || ''}${nl}${nl}`;
    
    // HTML part
    message += `--${boundary}${nl}`;
    message += `Content-Type: text/html; charset=UTF-8${nl}${nl}`;
    message += `${options.html || ''}${nl}${nl}`;
    
    message += `--${boundary}--`;
    
    return this.encodeMessage(message);
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const encodedMessage = this.createEmail({
        from: options.from || `Teach Niche <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      });
      
      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
      
      console.log('Email sent successfully:', res.data);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to Teach Niche!';
    const text = `Hello ${name},\n\nWelcome to Teach Niche! We're excited to have you join our community of experts and learners.\n\nBest regards,\nThe Teach Niche Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a5568;">Welcome to Teach Niche!</h1>
        <p>Hello ${name},</p>
        <p>Welcome to Teach Niche! We're excited to have you join our community of experts and learners.</p>
        <p>Best regards,<br>The Teach Niche Team</p>
      </div>
    `;
    
    return this.sendEmail({ to, subject, text, html });
  }
  
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
    const subject = 'Reset Your Teach Niche Password';
    const text = `Hello,\n\nYou requested to reset your password. Please click the link below to reset your password:\n\n${resetLink}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Teach Niche Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a5568;">Reset Your Password</h1>
        <p>Hello,</p>
        <p>You requested to reset your password. Please click the button below to reset your password:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Teach Niche Team</p>
      </div>
    `;
    
    return this.sendEmail({ to, subject, text, html });
  }
  
  async sendPurchaseConfirmation(to: string, lessonTitle: string, amount: number): Promise<boolean> {
    const subject = `Your Purchase: ${lessonTitle}`;
    const text = `Hello,\n\nThank you for your purchase of "${lessonTitle}" for $${amount.toFixed(2)}.\n\nYou can access your lesson from your dashboard.\n\nBest regards,\nThe Teach Niche Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a5568;">Purchase Confirmation</h1>
        <p>Hello,</p>
        <p>Thank you for your purchase of <strong>${lessonTitle}</strong> for <strong>$${amount.toFixed(2)}</strong>.</p>
        <p>You can access your lesson from your dashboard.</p>
        <p>Best regards,<br>The Teach Niche Team</p>
      </div>
    `;
    
    return this.sendEmail({ to, subject, text, html });
  }
}
import { EmailOptions, EmailService } from './interface';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GoogleWorkspaceEmail implements EmailService {
  private oauth2Client: OAuth2Client;
  private gmail: any;
  
  constructor() {
    // Create OAuth2 client
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    // Set credentials
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    
    // Initialize Gmail API
    this.gmail = google.gmail({
      version: 'v1',
      auth: this.oauth2Client
    });
  }
  
  private encodeMessage(message: string) {
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  
  private createEmail(options: EmailOptions) {
    const boundary = 'boundary';
    const nl = '\n';
    
    let message = '';
    message += `From: ${options.from}${nl}`;
    message += `To: ${options.to}${nl}`;
    message += `Subject: ${options.subject}${nl}`;
    message += `MIME-Version: 1.0${nl}`;
    message += `Content-Type: multipart/alternative; boundary=${boundary}${nl}${nl}`;
    
    // Text part
    message += `--${boundary}${nl}`;
    message += `Content-Type: text/plain; charset=UTF-8${nl}${nl}`;
    message += `${options.text || ''}${nl}${nl}`;
    
    // HTML part
    message += `--${boundary}${nl}`;
    message += `Content-Type: text/html; charset=UTF-8${nl}${nl}`;
    message += `${options.html || ''}${nl}${nl}`;
    
    message += `--${boundary}--`;
    
    return this.encodeMessage(message);
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const encodedMessage = this.createEmail({
        from: options.from || `Teach Niche <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      });
      
      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
      
      console.log('Email sent successfully:', res.data);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to Teach Niche!';
    const text = `Hello ${name},\n\nWelcome to Teach Niche! We're excited to have you join our community of experts and learners.\n\nBest regards,\nThe Teach Niche Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a5568;">Welcome to Teach Niche!</h1>
        <p>Hello ${name},</p>
        <p>Welcome to Teach Niche! We're excited to have you join our community of experts and learners.</p>
        <p>Best regards,<br>The Teach Niche Team</p>
      </div>
    `;
    
    return this.sendEmail({ to, subject, text, html });
  }
  
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
    const subject = 'Reset Your Teach Niche Password';
    const text = `Hello,\n\nYou requested to reset your password. Please click the link below to reset your password:\n\n${resetLink}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Teach Niche Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a5568;">Reset Your Password</h1>
        <p>Hello,</p>
        <p>You requested to reset your password. Please click the button below to reset your password:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Teach Niche Team</p>
      </div>
    `;
    
    return this.sendEmail({ to, subject, text, html });
  }
  
  async sendPurchaseConfirmation(to: string, lessonTitle: string, amount: number): Promise<boolean> {
    const subject = `Your Purchase: ${lessonTitle}`;
    const text = `Hello,\n\nThank you for your purchase of "${lessonTitle}" for $${amount.toFixed(2)}.\n\nYou can access your lesson from your dashboard.\n\nBest regards,\nThe Teach Niche Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a5568;">Purchase Confirmation</h1>
        <p>Hello,</p>
        <p>Thank you for your purchase of <strong>${lessonTitle}</strong> for <strong>$${amount.toFixed(2)}</strong>.</p>
        <p>You can access your lesson from your dashboard.</p>
        <p>Best regards,<br>The Teach Niche Team</p>
      </div>
    `;
    
    return this.sendEmail({ to, subject, text, html });
  }
}
import { OAuth2Client } from 'google-auth-library';
import { gmail_v1, google } from 'googleapis';
import { EmailOptions, EmailService } from './index';

export class GoogleWorkspaceEmail implements EmailService {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail;
  
  constructor() {
    // Create OAuth2 client
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    // Set credentials using refresh token
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    
    // Create Gmail client
    this.gmail = google.gmail({
      version: 'v1',
      auth: this.oauth2Client
    });
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Create email content
      const emailContent = this.createEmailContent(options);
      
      // Encode the email
      const encodedEmail = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      // Send the email
      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      });
      
      return res.status === 200;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Welcome to Teach Niche',
      text: `Hello ${name},\n\nWelcome to Teach Niche! We're excited to have you join our community of instructors and learners.\n\nGet started by exploring lessons or creating your own content.\n\nBest regards,\nThe Teach Niche Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4a5568;">Welcome to Teach Niche!</h1>
          <p>Hello ${name},</p>
          <p>We're excited to have you join our community of instructors and learners.</p>
          <p>Get started by exploring lessons or creating your own content.</p>
          <p>Best regards,<br>The Teach Niche Team</p>
        </div>
      `
    });
  }
  
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Reset Your Password - Teach Niche',
      text: `Hello,\n\nYou requested to reset your password. Click the link below to set a new password:\n\n${resetLink}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Teach Niche Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4a5568;">Reset Your Password</h1>
          <p>Hello,</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4a5568; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The Teach Niche Team</p>
        </div>
      `
    });
  }
  
  async sendPurchaseConfirmation(to: string, lessonTitle: string, amount: number): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Purchase Confirmation - Teach Niche',
      text: `Hello,\n\nThank you for your purchase of "${lessonTitle}" for $${amount.toFixed(2)}.\n\nYou can access your lesson from your dashboard.\n\nBest regards,\nThe Teach Niche Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4a5568;">Purchase Confirmation</h1>
          <p>Hello,</p>
          <p>Thank you for your purchase of <strong>${lessonTitle}</strong> for <strong>$${amount.toFixed(2)}</strong>.</p>
          <p>You can access your lesson from your dashboard.</p>
          <p>Best regards,<br>The Teach Niche Team</p>
        </div>
      `
    });
  }
  
  private createEmailContent(options: EmailOptions): string {
    const boundary = 'boundary_' + Date.now().toString();
    const sender = process.env.EMAIL_SENDER || 'noreply@teachniche.com';
    
    let email = [
      `From: Teach Niche <${sender}>`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary=${boundary}`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      '',
      options.text,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      options.html || '',
      '',
      `--${boundary}--`
    ].join('\r\n');
    
    return email;
  }
}

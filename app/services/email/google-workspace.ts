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

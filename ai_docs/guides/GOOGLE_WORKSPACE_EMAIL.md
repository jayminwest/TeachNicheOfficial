# Configuring Google Workspace Email for Authentication

This guide covers setting up Google Workspace SMTP for authentication emails in our GCP environment.

## Prerequisites
- Google Workspace admin account
- Enabled Gmail API in your GCP project
- Domain verification completed in Google Search Console

## Setup Steps

### 1. Enable Gmail API
1. Go to [GCP Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** > **Library**
3. Search for "Gmail API" and enable it
4. Create API credentials:
   ```bash
   gcloud iam service-accounts create smtp-service-account \
     --display-name="SMTP Service Account"
     
   gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
     --member="serviceAccount:smtp-service-account@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
     --role="roles/gmail.send"
   ```

### 2. Configure OAuth 2.0 Client
1. Create OAuth consent screen:
   - Application type: Internal
   - Scopes: `../auth/gmail.send`
   - Test users: Add admin accounts
2. Create OAuth 2.0 Client ID credentials
3. Download JSON credentials file

### 3. Environment Configuration
Add to `.env`:
```ini
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REFRESH_TOKEN=your-refresh-token
GOOGLE_SMTP_USER=smtp-service-account@your-domain.com
```

## Implementing Email Sending

### Node.js Email Service
```typescript
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  });

  const accessToken = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GOOGLE_SMTP_USER,
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
      accessToken: accessToken.token!,
    },
  });
};

// Send verification email example
const sendVerificationEmail = async (email: string, verificationLink: string) => {
  const transporter = await createTransporter();
  
  await transporter.sendMail({
    from: `"Teach Niche" <${process.env.GOOGLE_SMTP_USER}>`,
    to: email,
    subject: "Verify Your Email Address",
    html: `<p>Click <a href="${verificationLink}">here</a> to verify your email</p>`,
  });
};
```

## Security Best Practices
- Rotate OAuth refresh tokens quarterly
- Restrict SMTP service account to minimum permissions
- Enable audit logging for Gmail API
- Use separate OAuth client IDs for different environments
- Implement rate limiting (5 emails/minute per user)

## Troubleshooting
- **Authentication errors**: Verify OAuth scopes and token validity
- **Delivery failures**: Check domain SPF/DKIM records
- **Rate limits**: Monitor through Cloud Monitoring
# Setting Up Google Workspace Email for Authentication

This guide provides step-by-step instructions for configuring Google Workspace Email for authentication and notifications in the Teach Niche platform.

## Prerequisites

- Google Workspace account (formerly G Suite)
- Admin access to your Google Workspace
- Domain verification completed
- Basic understanding of email authentication flows

## Google Workspace Email Configuration

### 1. Set Up Google Workspace Account

If you don't already have a Google Workspace account:

1. Go to [Google Workspace](https://workspace.google.com/)
2. Click "Get Started" and follow the sign-up process
3. Verify your domain ownership
4. Set up initial users

### 2. Create a Service Account for Email

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
5. Configure the service account:
   - Name: `teach-niche-email`
   - Description: "Service account for Teach Niche email services"
6. Click "Create and Continue"
7. Assign the following roles:
   - Gmail API User
8. Click "Continue" and then "Done"
9. Click on the newly created service account
10. Go to the "Keys" tab
11. Click "Add Key" > "Create new key"
12. Select JSON format
13. Click "Create" and save the downloaded JSON file securely

### 3. Enable Gmail API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" in the results
4. Click "Enable"

### 4. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "Internal" if you're only using this within your organization, or "External" if you need to authenticate outside users
3. Fill in the required information:
   - App name: "Teach Niche Email Service"
   - User support email: Your support email
   - Developer contact information: Your contact email
4. Click "Save and Continue"
5. Add the following scopes:
   - `https://www.googleapis.com/auth/gmail.send`
6. Click "Save and Continue"
7. Add test users if using External user type
8. Click "Save and Continue"

### 5. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Name: "Teach Niche Email Client"
5. Add authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for development)
6. Click "Create"
7. Save the Client ID and Client Secret

## Implementing in Code

### 1. Set Up Environment Variables

Add the following to your `.env.local` file:

```
# Google Workspace Email
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/callback/google
GOOGLE_EMAIL_USER=noreply@your-domain.com
```

### 2. Implement Email Service

Create an email service using the Gmail API:

```typescript
// services/email/google-workspace.ts
import { OAuth2Client } from 'google-auth-library';
import { gmail_v1, google } from 'googleapis';
import { EmailOptions, EmailService } from './interface';

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
    
    // Set credentials
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    
    // Create Gmail service
    this.gmail = google.gmail({
      version: 'v1',
      auth: this.oauth2Client
    });
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Create email content
      const emailContent = this.createEmail(options);
      
      // Encode the email
      const encodedEmail = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      // Send the email
      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  
  private createEmail(options: EmailOptions): string {
    const { to, subject, text, html, attachments = [] } = options;
    const from = process.env.GOOGLE_EMAIL_USER || 'noreply@teachniche.com';
    
    // Create email headers
    let email = [
      `From: Teach Niche <${from}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="boundary"',
      '',
      '--boundary',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      text,
      ''
    ];
    
    // Add HTML part if provided
    if (html) {
      email = email.concat([
        '--boundary',
        'Content-Type: text/html; charset=UTF-8',
        '',
        html,
        ''
      ]);
    }
    
    // Add attachments if any
    attachments.forEach(attachment => {
      const { filename, content, contentType = 'application/octet-stream' } = attachment;
      const contentEncoded = Buffer.from(content).toString('base64');
      
      email = email.concat([
        '--boundary',
        `Content-Type: ${contentType}; name="${filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${filename}"`,
        '',
        contentEncoded,
        ''
      ]);
    });
    
    // Close the boundary
    email.push('--boundary--');
    
    return email.join('\r\n');
  }
  
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to Teach Niche!';
    const text = `Hello ${name},\n\nWelcome to Teach Niche! We're excited to have you join our community of learners and experts.\n\nGet started by exploring lessons or creating your own content.\n\nBest regards,\nThe Teach Niche Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a5568;">Welcome to Teach Niche!</h1>
        <p>Hello ${name},</p>
        <p>Welcome to Teach Niche! We're excited to have you join our community of learners and experts.</p>
        <p>Get started by exploring lessons or creating your own content.</p>
        <div style="margin: 30px 0;">
          <a href="https://teachniche.com/explore" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Explore Lessons</a>
        </div>
        <p>Best regards,<br>The Teach Niche Team</p>
      </div>
    `;
    
    return this.sendEmail({ to, subject, text, html });
  }
  
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
    const subject = 'Reset Your Teach Niche Password';
    const text = `Hello,\n\nYou requested to reset your password for Teach Niche. Please click the link below to reset your password:\n\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nThe Teach Niche Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a5568;">Reset Your Password</h1>
        <p>Hello,</p>
        <p>You requested to reset your password for Teach Niche. Please click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </div>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>The Teach Niche Team</p>
      </div>
    `;
    
    return this.sendEmail({ to, subject, text, html });
  }
  
  async sendPurchaseConfirmation(to: string, lessonTitle: string, amount: number): Promise<boolean> {
    const subject = `Your Purchase: ${lessonTitle}`;
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const text = `Hello,\n\nThank you for your purchase of "${lessonTitle}" for ${formattedAmount}.\n\nYou can access your lesson at any time from your dashboard.\n\nBest regards,\nThe Teach Niche Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a5568;">Purchase Confirmation</h1>
        <p>Hello,</p>
        <p>Thank you for your purchase of <strong>${lessonTitle}</strong> for <strong>${formattedAmount}</strong>.</p>
        <p>You can access your lesson at any time from your dashboard.</p>
        <div style="margin: 30px 0;">
          <a href="https://teachniche.com/dashboard" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Go to Dashboard</a>
        </div>
        <p>Best regards,<br>The Teach Niche Team</p>
      </div>
    `;
    
    return this.sendEmail({ to, subject, text, html });
  }
}
```

### 3. Create Email Interface

```typescript
// services/email/interface.ts
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
```

### 4. Create Email Service Factory

```typescript
// services/email/index.ts
import { EmailOptions, EmailService } from './interface';
import { GoogleWorkspaceEmail } from './google-workspace';

// Factory function to create the appropriate email service
export function createEmailService(): EmailService {
  return new GoogleWorkspaceEmail();
}

// Convenience function for sending emails
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const emailService = createEmailService();
  return emailService.sendEmail(options);
}
```

## Customizing Email Templates

### 1. Welcome Email Template

Customize the welcome email in the `sendWelcomeEmail` method:

- Update the subject line
- Customize the email content
- Add your branding elements
- Include helpful links for new users

### 2. Password Reset Template

Customize the password reset email in the `sendPasswordResetEmail` method:

- Update the subject line
- Customize the email content
- Add security information
- Set an appropriate expiration time for the reset link

### 3. Purchase Confirmation Template

Customize the purchase confirmation email in the `sendPurchaseConfirmation` method:

- Include detailed purchase information
- Add receipt number or transaction ID
- Include tax information if applicable
- Add links to access the purchased content

## Testing Email Functionality

### 1. Create a Test Script

```typescript
// scripts/test-email.ts
import { createEmailService } from '../services/email';

async function testEmail() {
  const emailService = createEmailService();
  
  // Test basic email
  const result = await emailService.sendEmail({
    to: 'test@example.com',
    subject: 'Test Email',
    text: 'This is a test email from Teach Niche.',
    html: '<p>This is a <strong>test email</strong> from Teach Niche.</p>'
  });
  
  console.log('Email sent:', result);
  
  // Test welcome email
  const welcomeResult = await emailService.sendWelcomeEmail(
    'test@example.com',
    'Test User'
  );
  
  console.log('Welcome email sent:', welcomeResult);
}

testEmail().catch(console.error);
```

### 2. Run the Test Script

```bash
ts-node scripts/test-email.ts
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify OAuth credentials are correct
   - Check if refresh token is valid
   - Ensure Gmail API is enabled

2. **Email Delivery Issues**
   - Check spam/junk folders
   - Verify sender email is properly configured
   - Check for email sending quotas

3. **Template Rendering Issues**
   - Test email templates in different email clients
   - Ensure HTML is properly formatted
   - Use inline CSS for better compatibility

## Security Considerations

- Store OAuth credentials securely
- Use environment variables for sensitive information
- Implement rate limiting for email sending
- Monitor for suspicious email activity
- Regularly rotate OAuth refresh tokens
- Use SPF, DKIM, and DMARC for email authentication

## Next Steps

After setting up Google Workspace Email:

1. Implement email verification flow
2. Create additional email templates for different scenarios
3. Set up email analytics to track open rates
4. Implement email preferences for users
5. Create an email queue system for high-volume scenarios

---

*For any issues with this setup, please contact the DevOps team.*

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

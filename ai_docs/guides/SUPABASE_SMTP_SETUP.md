# Setting Up SMTP Email Authentication in Supabase

This guide provides step-by-step instructions for configuring SMTP email authentication in Supabase for the Teach Niche platform.

## Prerequisites

- Admin access to your Supabase project
- SMTP server credentials from your email service provider (SendGrid, Mailgun, etc.)
- Basic understanding of authentication flows

## SMTP Configuration Steps

### 1. Access Supabase Authentication Settings

1. Log in to the [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** in the left sidebar
4. Click on **Providers** tab

### 2. Configure Email Provider

1. In the Email Provider section, toggle **Email** to enabled
2. Select **SMTP** as the email provider (instead of the default Supabase SMTP)

### 3. Enter SMTP Credentials

Fill in the following fields with your SMTP provider's information:

- **SMTP Host**: Your SMTP server address (e.g., `smtp.sendgrid.net`)
- **SMTP Port**: Typically 587 for TLS or 465 for SSL
- **SMTP User**: Your SMTP username
- **SMTP Password**: Your SMTP password
- **SMTP Sender Name**: The name that will appear as the sender (e.g., "Teach Niche")
- **SMTP Sender Address**: The email address that will appear as the sender (e.g., `noreply@teachniche.com`)

### 4. Configure Security Settings

1. Select the appropriate **Security** option:
   - **TLS (STARTTLS)**: For port 587
   - **SSL/TLS**: For port 465
   
2. Set appropriate **Rate Limits** to prevent abuse:
   - Recommended: 10 emails per hour per user
   - Adjust based on your expected usage patterns

### 5. Customize Email Templates

1. Navigate to the **Email Templates** tab
2. Customize each template type:
   - **Confirmation**: Sent when a user signs up
   - **Invite**: Sent when inviting users
   - **Magic Link**: For passwordless authentication
   - **Recovery**: For password reset requests

For each template, customize:
- Subject line
- HTML content (with your branding)
- Text content (for email clients that don't support HTML)

### 6. Test the Configuration

1. Click on **Test SMTP Configuration**
2. Enter a test email address
3. Select a template to test
4. Click **Send Test Email**
5. Verify receipt and appearance of the test email

## Implementing in Code

After configuring SMTP in Supabase, update your authentication components:

### Update Sign-Up Component

Ensure your sign-up component handles email verification:

```typescript
// Example code for sign-up with email
const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Handle successful sign-up
    // Note: User will need to verify email before being fully authenticated
    return { success: true, message: "Please check your email for verification link" };
  } catch (error) {
    console.error("Error signing up:", error);
    return { success: false, message: error.message };
  }
};
```

### Implement Password Reset

Add password reset functionality:

```typescript
// Example code for password reset request
const requestPasswordReset = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    
    return { success: true, message: "Password reset instructions sent to your email" };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return { success: false, message: error.message };
  }
};
```

## Troubleshooting

### Common Issues

1. **Emails not being sent**
   - Verify SMTP credentials are correct
   - Check if your SMTP provider has sending limits
   - Ensure your domain has proper SPF and DKIM records

2. **Emails going to spam**
   - Set up SPF and DKIM records for your domain
   - Ensure your email templates don't contain spam triggers
   - Use a reputable SMTP provider

3. **Verification links not working**
   - Check that your Site URL is configured correctly in Supabase
   - Verify the redirect URLs are allowed in your Supabase settings

## Security Considerations

- Use environment variables for SMTP credentials in development
- Implement rate limiting for authentication attempts
- Consider adding CAPTCHA for public-facing forms
- Monitor authentication logs for suspicious activity

## Next Steps

After setting up SMTP authentication:

1. Update your UI to include email verification status
2. Add user onboarding flows for newly verified users
3. Implement proper error handling for all authentication scenarios
4. Consider adding additional authentication methods (social logins)

---

*For any issues with this setup, please contact the development team.*

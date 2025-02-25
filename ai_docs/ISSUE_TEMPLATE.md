# Feature: Implement Email Authentication with SMTP in Supabase

## Issue Description

Currently, our application lacks email-based authentication. We need to implement email sign-up and sign-in functionality using Supabase Auth with a custom SMTP server configuration. This will allow users to create accounts using their email addresses and receive verification emails.

## Implementation Steps

1. Configure SMTP server settings in Supabase
2. Update authentication components to support email sign-up
3. Add email verification flow
4. Implement password reset functionality
5. Update UI components to reflect new authentication options

## Expected Behavior

- Users should be able to sign up with email and password
- Users should receive verification emails after sign-up
- Users should be able to verify their email addresses by clicking links in the emails
- Users should be able to request and complete password resets
- The authentication UI should clearly present email options

## Technical Analysis

Supabase Auth supports email authentication with custom SMTP servers. We need to:

1. Configure SMTP settings in the Supabase dashboard
2. Update our authentication service to handle email-specific flows
3. Modify UI components to support email authentication
4. Implement proper error handling for email-specific issues

The email templates for verification and password reset will need to be customized to match our brand.

## Potential Implementation Approach

1. SMTP Configuration:
   - Set up SMTP credentials in Supabase Auth settings
   - Configure email templates for verification and password reset

2. Code Implementation:
   - Update auth service to handle email sign-up/sign-in
   - Add email verification handling
   - Implement password reset flow
   - Update UI components

## Likely Affected Files

1. `app/services/auth/AuthContext.tsx` - Update authentication context
2. `app/components/ui/sign-in.tsx` - Add email sign-in UI
3. `app/components/ui/sign-up.tsx` - Add email sign-up UI
4. `app/components/ui/auth-dialog.tsx` - Update auth dialog for email flows
5. `app/components/ui/password-reset.tsx` - Create new component for password reset

## Testing Requirements

- Test email sign-up flow with valid and invalid email addresses
- Verify that verification emails are sent and links work correctly
- Test password reset flow
- Verify that error messages are displayed appropriately
- Test across multiple browsers and devices

## Environment

- **Browser**: Chrome, Firefox, Safari, Edge
- **Environment**: Development, Staging, Production
- **Authentication Provider**: Supabase Auth with SMTP

## Priority

High - Email authentication is a standard feature expected by users and will increase user acquisition and retention.

## Additional Context

- We'll need SMTP server credentials (likely from a service like SendGrid, Mailgun, or similar)
- Email templates should follow our brand guidelines
- Consider rate limiting for email-based actions to prevent abuse
- Documentation for the team on how the email authentication flow works will be needed

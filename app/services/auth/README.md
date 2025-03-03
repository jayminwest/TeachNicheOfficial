# Supabase Authentication Setup

## Enabling Google Authentication

To enable Google authentication in your local Supabase instance:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Providers
3. Find Google in the list of providers
4. Toggle the "Enable" switch to ON
5. Configure the following:
   - Client ID: Get this from the Google Cloud Console
   - Client Secret: Get this from the Google Cloud Console
   - Authorized redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

### Creating Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Set Application Type to "Web application"
6. Add authorized redirect URIs:
   - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)
7. Click "Create"
8. Copy the Client ID and Client Secret to use in Supabase

### Local Development Configuration

For local development, make sure to:

1. Add `http://localhost:3000/auth/callback` as an authorized redirect URI in Google Cloud Console
2. Configure your local Supabase instance with the correct Google OAuth credentials
3. Set the Site URL in Supabase to `http://localhost:3000`

## Troubleshooting

If you see the error "Unsupported provider: provider is not enabled":

1. Ensure Google provider is enabled in Supabase dashboard
2. Verify that Client ID and Client Secret are correctly configured
3. Check that redirect URIs are properly set up in both Supabase and Google Cloud Console

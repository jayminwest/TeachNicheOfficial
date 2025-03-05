# Mux Video Integration

This document outlines how to set up and configure Mux video for both development and production environments.

## Required Environment Variables

Add these to your `.env.local` file for development and to your production environment:

```
# Mux API Access
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret

# For signed playback (required for paid content)
MUX_SIGNING_KEY=your_mux_signing_private_key
MUX_SIGNING_KEY_ID=your_mux_signing_key_id
```

## Setting Up Mux Signing Keys

1. Log in to your Mux dashboard: https://dashboard.mux.com/
2. Navigate to Settings > Secure Video
3. Create a new signing key
4. Copy the private key and key ID to your environment variables

## Playback Policies

- **Free content**: Uses `public` playback policy
- **Paid content**: Uses `signed` playback policy with JWT tokens

## Testing Signed Playback

To test signed playback in development:

1. Make sure you have set up the MUX_SIGNING_KEY and MUX_SIGNING_KEY_ID environment variables
2. Create a lesson with a price greater than 0
3. Upload a video to that lesson
4. The system will automatically use signed playback for this content

## Troubleshooting

If you encounter playback issues:

1. Check browser console for specific error messages
2. Verify that your environment variables are correctly set
3. Ensure the signing key is valid and properly formatted
4. Check that the video asset exists and has the correct playback policy

For more information, refer to the [Mux Documentation](https://docs.mux.com/).

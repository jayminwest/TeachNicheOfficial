# Teach Niche

> **IMPORTANT: GCP Migration in Progress**
>
> We are migrating from Supabase to Google Cloud Platform (GCP). During this transition:
>
> 1. Both systems will operate in parallel
> 2. New features should use the abstraction layers in `app/services/*`
> 3. Set `NEXT_PUBLIC_USE_GCP=true` to use GCP services
>
> See issue #2025-02-27 for migration details.
>
> **IMPORTANT: Stripe Configuration for Merchant of Record Transition**
>
> We are transitioning from Stripe Connect to a merchant of record payment model. This requires manual configuration in the Stripe Dashboard:
>
> 1. **Update Business Settings**: Ensure business information reflects your role as direct seller
> 2. **Configure Tax Settings**: Set up tax registration numbers and automatic tax calculation
> 3. **Update Payout Settings**: Configure payout schedule and verify bank account information
> 4. **Configure Webhooks**: Update endpoints to handle new payment and payout events
> 5. **Set Up Financial Reporting**: Create custom reports for revenue, fees, and payouts
> 6. **Update Customer Communication**: Revise email templates and receipts
> 7. **Update Legal Documents**: Revise Terms of Service and Privacy Policy
>
> See issue #038 for detailed instructions on completing these steps.

A modern platform empowering educators to create, share, and monetize educational content. Built with Next.js, TypeScript, and Supabase, following modular and minimalist design principles.

## Features

- 🎥 Video course hosting with Mux integration
  - Secure video upload and processing
  - Adaptive streaming playback
  - Thumbnail generation
  - Analytics and engagement tracking
- 💰 Monetization via Stripe Connect
  - Secure payment processing
  - Automated creator payouts
  - Subscription management
  - Revenue analytics
- 🔐 Authentication & Authorization
  - Email and OAuth sign-in
  - Role-based access control
  - Protected routes and content
- 📱 Modern UI/UX
  - Responsive design with Tailwind CSS
  - Accessible components (WCAG compliant)
  - Dark/light theme support
  - Real-time updates
- 🚀 Performance Optimized
  - Edge Functions deployment
  - Route-based code splitting
  - Optimized Core Web Vitals
  - CDN-powered content delivery

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript 5.x
- **Database:** Google Cloud SQL (PostgreSQL) / Supabase (PostgreSQL)
- **Authentication:** Firebase Authentication / Supabase Auth
- **Storage:** Google Cloud Storage / Supabase Storage
- **UI Components:** Shadcn UI
- **Styling:** Tailwind CSS
- **Video Platform:** Mux
- **Payments:** Stripe Connect
- **Email:** Google Workspace
- **Testing:** Jest & React Testing Library
- **Deployment:** Vercel Edge Functions

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Google Cloud Platform account (or Supabase project during transition)
- Firebase project (configured with Authentication)
- Stripe Connect account
- Mux account
- Google Workspace account

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/teach-niche.git
cd teach-niche
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.template .env.local
```

Required environment variables:

```env
# Feature Flag for GCP Migration
NEXT_PUBLIC_USE_GCP=false  # Set to true to use GCP services

# Supabase Configuration (used when NEXT_PUBLIC_USE_GCP=false)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# GCP Configuration (used when NEXT_PUBLIC_USE_GCP=true)
GCP_PROJECT_ID=teachnicheofficial
GCP_STORAGE_BUCKET=teachnicheofficial-media
GCP_KEY_FILE=path/to/service-account-key.json

# Database Configuration (for Cloud SQL)
DB_HOST=your_cloud_sql_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=5432

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=teachnicheofficial
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Google Workspace Email
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Mux Configuration
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_mux_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Development

### Standards & Guidelines

We follow strict development standards emphasizing:
- Modularity and minimalism
- Type safety with TypeScript
- Test-driven development
- Accessibility compliance

Refer to `ai_docs/DEVELOPER_GUIDELINES.md` for comprehensive standards.

### Test Data Generation

The project includes a comprehensive test data generation system to support development, testing, and demonstration environments.

#### Generating Test Data

To generate test data, use the following command:

```bash
# Generate a small dataset for development environment (default)
npm run generate-test-data

# Generate a medium dataset for test environment
npm run generate-test-data -- --medium --test

# Generate a large dataset for production environment
npm run generate-test-data -- --large --prod

# Generate data with Mux video assets (requires valid Mux credentials)
npm run generate-test-data -- --use-mux

# Generate data without saving to database (JSON files only)
npm run generate-test-data -- --no-db

# See all available options
npm run generate-test-data -- --help
```

### Environment Configuration

To set up environment-specific configurations, use:

```bash
# Create environment files and verify connections
npm run setup-environment

# Create environment files only
npm run setup-environment -- --create-env

# Verify database connections only
npm run setup-environment -- --verify

# Verify Firebase configuration only
npm run setup-environment -- --verify-firebase

# Verify Mux configuration
npm run setup-environment -- --verify-mux

# Target specific environment
npm run setup-environment -- --dev
npm run setup-environment -- --prod
npm run setup-environment -- --test

# See all available options
npm run setup-environment -- --help
```

Each environment (development, test, production) has its own database instance and configuration to ensure proper isolation.

### Testing

Run the full test suite:
```bash
npm test && vercel build
```

Key testing requirements:
- Maintain >80% test coverage
- Include component, integration, and E2E tests
- Test accessibility compliance
- Verify proper error handling

### Code Quality

- ESLint for code style enforcement
- Prettier for consistent formatting
- TypeScript for type safety
- No "any" types allowed
- Proper component documentation

## Deployment

The application uses Vercel's Edge Functions for optimal performance:

- Automatic preview deployments for PRs
- Zero-downtime production deployments
- Automated rollbacks on failure
- Environment variable management
- Performance monitoring

## Contributing

1. Review `ai_docs/DEVELOPER_GUIDELINES.md`
2. Fork the repository
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Follow our coding standards
5. Write comprehensive tests
6. Submit a Pull Request

## Finding GCP API Keys and Credentials

### Firebase API Keys
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (teachnicheofficial)
3. Click the gear icon (⚙️) next to "Project Overview" and select "Project settings"
4. Scroll down to "Your apps" section
5. Select your web app or create a new one
6. Find your API keys and configuration in the "SDK setup and configuration" section

### Google Cloud Service Account Keys
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (teachnicheofficial)
3. Navigate to "IAM & Admin" > "Service Accounts"
4. Create a new service account or select an existing one
5. Go to the "Keys" tab
6. Click "Add Key" > "Create new key"
7. Select JSON format and click "Create"
8. The key file will be downloaded to your computer

### Google Workspace API Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (teachnicheofficial)
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure the OAuth consent screen if prompted
6. Select "Web application" as the application type
7. Add authorized redirect URIs (including https://developers.google.com/oauthplayground)
8. Click "Create" to get your Client ID and Client Secret
9. To get a refresh token, go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
10. Click the gear icon (⚙️) and check "Use your own OAuth credentials"
11. Enter your Client ID and Client Secret
12. Select the required scopes (https://mail.google.com/ for Gmail)
13. Click "Exchange authorization code for tokens" to get your refresh token

## Support & Status

- Google Cloud Status: https://status.cloud.google.com/
- Firebase Status: https://status.firebase.google.com/
- Stripe Status: https://status.stripe.com
- Mux Status: https://status.mux.com
- Supabase Status: https://status.supabase.com
- Vercel Status: https://www.vercel-status.com

## License

This project is proprietary software. All rights reserved.

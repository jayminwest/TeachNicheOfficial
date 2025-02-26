# Teach Niche

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
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **UI Components:** Shadcn UI
- **Styling:** Tailwind CSS
- **Video Platform:** Mux
- **Payments:** Stripe Connect
- **Testing:** Jest & React Testing Library
- **Deployment:** Vercel Edge Functions

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- A Supabase project
- Stripe Connect account
- Mux account

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
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

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

## Support & Status

- Stripe Status: https://status.stripe.com
- Mux Status: https://status.mux.com
- Supabase Status: https://status.supabase.com
- Vercel Status: https://www.vercel-status.com

## License

This project is proprietary software. All rights reserved.

# Teach Niche

A modern platform for educators to create and monetize their educational content. Built with Next.js, TypeScript, and Supabase.

## Features

- 🎥 Video course hosting and management via Vimeo integration
- 💰 Secure payments and creator payouts with Stripe Connect
- 🔐 Authentication and user management
- 📱 Responsive, modern UI built with Shadcn UI
- 🎨 Fully customizable theming
- ⚡ Server-side rendering for optimal performance

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Database & Auth:** Supabase
- **Video Platform:** Vimeo
- **Payments:** Stripe Connect
- **Deployment:** Vercel

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/teach-niche.git
cd teach-niche
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template and fill in your values:
```bash
cp env.template .env.local
```

4. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `VIMEO_ACCESS_TOKEN`: Vimeo API access token

See `env.template` for all required variables.

## Development Guidelines

Please refer to `ai_docs/DEVELOPER_GUIDELINES.md` for detailed development standards and best practices.

## Testing

Run the test suite:
```bash
npm test
```

## Deployment

The application is automatically deployed to Vercel on push to the main branch.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Create a redirect URL
  const redirectUrl = 'https://dashboard.stripe.com/';
  
  // Return a redirect response
  return NextResponse.redirect(redirectUrl);
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Create a simple HTML page with JavaScript redirect
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirect Test</title>
      <script>
        // Log that we're about to redirect
        console.log('HTML redirect test: About to redirect to Stripe');
        
        // Redirect after a short delay
        setTimeout(function() {
          window.location.href = 'https://dashboard.stripe.com/';
        }, 2000);
      </script>
    </head>
    <body>
      <h1>Redirect Test</h1>
      <p>You should be redirected to Stripe in 2 seconds...</p>
      <p>If not, <a href="https://dashboard.stripe.com/">click here</a>.</p>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

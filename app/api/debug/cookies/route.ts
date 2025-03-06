import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // In Next.js 15, we need to use cookies() directly without storing it
    // Each method call on cookies() needs to be awaited
    const allCookies = await cookies().getAll();
    
    // Get specific auth cookies - also needs to be awaited
    const authCookie = await cookies().get('sb-erhavrzwpyvnpefifsfu-auth-token');
    
    return NextResponse.json({
      message: 'Cookie debug information',
      cookieCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      authCookieExists: !!authCookie,
      authCookieValue: authCookie ? '***' : null // Don't expose actual value
    });
  } catch (error) {
    console.error('Error in cookie debug endpoint:', error);
    return NextResponse.json({
      message: 'Error accessing cookies',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // In Next.js 15, cookies() returns a ReadonlyRequestCookies object
    const cookieStore = cookies();
    
    // Get all cookies by converting to array
    const allCookies = Array.from(cookieStore);
    
    // Get specific auth cookies
    const authCookie = cookieStore.get('sb-erhavrzwpyvnpefifsfu-auth-token');
    
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

import { NextResponse } from 'next/server'
import type { RequestVoteResponse } from '@/app/types/request'

export const runtime = 'edge'

export async function POST(request: Request) {
  console.warn('DEPRECATED: /api/requests/vote endpoint is deprecated. Use /api/votes instead.');
  
  try {
    // Clone the request to preserve the body
    const clonedRequest = request.clone();
    
    // Get the request body
    const body = await clonedRequest.json();
    
    // Create a new request to the preferred endpoint
    const newUrl = new URL(request.url);
    newUrl.pathname = '/api/votes';
    
    const newRequest = new Request(newUrl.toString(), {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(body)
    });
    
    // Forward the request to the new endpoint
    const response = await fetch(newRequest);
    
    // Return the response from the new endpoint
    return response;
  } catch (error) {
    console.error('Error redirecting vote request:', error);
    
    // If redirection fails, return an error
    return NextResponse.json<RequestVoteResponse>(
      {
        success: false,
        currentVotes: 0,
        userHasVoted: false,
        error: 'database_error' // Using an allowed error type from the interface
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

// A simple counter to track API calls
let callCount = 0;

export async function GET() {
  // Increment the counter
  callCount++;
  
  return NextResponse.json({
    message: 'Render count debug endpoint',
    callCount,
    timestamp: new Date().toISOString()
  });
}

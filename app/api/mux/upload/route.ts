import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createUpload } from '@/app/services/mux';

// Helper function to get CORS headers
function getCorsHeaders(origin: string = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Content-Range, Authorization'
  };
}
// Helper function to handle POST request (upload initialization)
async function handlePostRequest() {
  const headersList = headers();
  const origin = headersList.get('origin') || '*';

  try {
    const upload = await createUpload();

    return NextResponse.json(
      upload,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin)
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to initialize video upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin)
        }
      }
    );
  }
}

export async function POST() {
  return handlePostRequest();
}

export async function PUT(request: Request) {
  if (!request?.body) {
    return NextResponse.json(
      { error: 'No request body' },
      { status: 400 }
    );
  }

  const headersList = headers();
  const origin = headersList.get('origin') || '*';
  
  // Get the upload URL from the query parameters
  const requestUrl = new URL(request.url);
  const uploadUrl = requestUrl.searchParams.get('url');
  
  const contentType = headersList.get('content-type');
  const contentLength = headersList.get('content-length');
  const contentRange = headersList.get('content-range');

  if (!uploadUrl || !uploadUrl.startsWith('https://')) {
    return NextResponse.json(
      { error: 'Missing or invalid upload URL' },
      {
        status: 400,
        headers: getCorsHeaders(origin)
      }
    );
  }

  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: request.body,
      headers: {
        'Content-Type': contentType || 'video/mp4',
        'Content-Length': contentLength || '',
        'Content-Range': contentRange || ''
      }
    });

    if (!response.ok) {
      throw new Error(`Mux upload failed: ${response.status} ${response.statusText}`);
    }

    return NextResponse.json(
      response.status === 308 
        ? { status: 'processing' }
        : { status: 'complete' },
      {
        status: response.status,
        headers: getCorsHeaders(origin)
      }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: getCorsHeaders(origin)
      }
    );
  }
}

export async function OPTIONS() {
  const headersList = headers();
  const origin = headersList.get('origin') || '*';

  return NextResponse.json(null, {
    status: 204,
    headers: getCorsHeaders(origin)
  });
}

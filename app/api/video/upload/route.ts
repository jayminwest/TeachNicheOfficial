import { NextResponse } from 'next/server';
import { createUpload } from '@/lib/mux';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function POST(request: Request) {
  return handleUpload(request);
}

export async function PUT(request: Request) {
  return handleUpload(request);
}

async function handleUpload(request: Request) {
  try {
    console.log(`Handling ${request.method} request to /api/video/upload`);
    
    // Log headers for debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Request headers:', headers);

    // Validate request method
    if (request.method !== 'POST' && request.method !== 'PUT') {
      throw new Error(`Unsupported method: ${request.method}`);
    }

    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType) {
      throw new Error('Missing content-type header');
    }

    const upload = await createUpload();
    
    if (!upload?.url || !upload?.id) {
      throw new Error('Invalid upload response from Mux');
    }
    
    const response = {
      uploadUrl: upload.url,
      assetId: upload.id
    };
    
    console.log('Successfully created upload:', response);
    
    // Set CORS headers
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
        'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  } catch (error) {
    console.error('Video upload initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize video upload';
    
    // Log the full error details
    console.error('Full error details:', {
      message: errorMessage,
      error: error
    });
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

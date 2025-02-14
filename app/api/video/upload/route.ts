import { NextResponse } from 'next/server';
import { createUpload } from '@/lib/mux';
import { headers } from 'next/headers';

// Helper function to handle both POST and PUT requests
async function handleUploadRequest() {
  const headersList = headers();
  const origin = headersList.get('origin') || '*';
  
  if (!headersList) {
    throw new Error('Failed to get request headers');
  }

  const method = headersList.get('method');
  const contentType = headersList.get('content-type');
  const contentLength = headersList.get('content-length');
  const contentRange = headersList.get('content-range');

  try {
    console.log('Upload request received:', {
      origin,
      method,
      contentType,
      contentLength,
      contentRange,
      headers: Object.fromEntries(headersList.entries?.() || [])
    });
    console.log('Starting upload request initialization');
    const upload = await createUpload();

    console.log('Successfully created upload URL:', {
      id: upload.id,
      hasUrl: !!upload.url,
      headers: {
        origin,
        allowMethods: 'POST, PUT, OPTIONS, HEAD',
        allowHeaders: 'Content-Type, Content-Length, Content-Range'
      }
    });

    return NextResponse.json(
      {
        uploadUrl: upload.url,
        assetId: upload.id
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS, HEAD',
          'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Content-Range, Authorization'
        }
      }
    );
  } catch (error) {
    console.error('Video upload initialization error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize video upload. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS, HEAD',
          'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Content-Range'
        }
      }
    );
  }
}

export async function POST() {
  return handleUploadRequest();
}

export async function PUT() {
  return handleUploadRequest();
}

export async function OPTIONS() {
  const headersList = headers();
  const origin = headersList.get('origin') || '*';

  return NextResponse.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

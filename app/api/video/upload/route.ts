import { NextResponse } from 'next/server';
import { createUpload } from '@/lib/mux';
import { headers } from 'next/headers';

// Helper function to handle POST request (upload initialization)
async function handlePostRequest() {
  const headersList = headers();
  const origin = headersList.get('origin') || '*';

  try {
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
  return handlePostRequest();
}

export async function PUT(request: Request) {
  const headersList = headers();
  const origin = headersList.get('origin') || '*';

  try {
    // Log the PUT request details
    console.log('PUT request received:', {
      origin,
      contentType: headersList.get('content-type'),
      contentLength: headersList.get('content-length'),
      contentRange: headersList.get('content-range')
    });

    // Forward the request to Mux
    const uploadUrl = headersList.get('x-mux-upload-url');
    if (!uploadUrl) {
      throw new Error('Missing Mux upload URL');
    }

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: request.body,
      headers: {
        'Content-Type': headersList.get('content-type') || 'video/mp4',
        'Content-Length': headersList.get('content-length') || '',
        'Content-Range': headersList.get('content-range') || ''
      }
    });

    if (!response.ok) {
      throw new Error(`Mux upload failed: ${response.status} ${response.statusText}`);
    }

    return NextResponse.json(
      { success: true },
      {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Content-Range, Authorization, X-Mux-Upload-Url'
        }
      }
    );
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Content-Range, Authorization, X-Mux-Upload-Url'
        }
      }
    );
  }
}

export async function OPTIONS() {
  const headersList = headers();
  const origin = headersList.get('origin') || '*';

  return NextResponse.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Content-Range, Authorization, X-Mux-Upload-Url'
    }
  });
}

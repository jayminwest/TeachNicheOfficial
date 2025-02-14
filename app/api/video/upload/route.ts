import { NextResponse } from 'next/server';
import Mux from "@mux/mux-node";

// Initialize Mux client with environment variables
const muxClient = new Mux(
  process.env.MUX_TOKEN_ID!,
  process.env.MUX_TOKEN_SECRET!
);
const { Video } = muxClient;

async function createUpload() {
  return await Video.Uploads.create({
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline",
    },
    cors_origin: "*",
  });
}
import { headers } from 'next/headers';

// Helper function to handle POST request (upload initialization)
async function handlePostRequest() {
  const headersList = await headers();
  const origin = await headersList.get('origin') || '*';

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
        url: upload.url,
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
  if (!request?.body) {
    return NextResponse.json(
      { error: 'No request body' },
      { status: 400 }
    );
  }

  const headersList = headers();
  const origin = headersList.get('origin') || '*';
  // Log headers for debugging
  console.log('Received headers:', Object.fromEntries(headersList.entries()));
  
  // Extract URL from request URL query params if not in headers
  const requestUrl = new URL(request.url);
  const uploadUrl = headersList.get('x-mux-upload-url') || 
                   headersList.get('X-Mux-Upload-Url') || 
                   requestUrl.searchParams.get('url');
                   
  const contentType = headersList.get('content-type');
  const contentLength = headersList.get('content-length');
  const contentRange = headersList.get('content-range');

  console.log('Upload URL:', uploadUrl);
  console.log('Request URL:', request.url);

  if (!uploadUrl) {
    console.error('Missing upload URL in headers and query params');
    return NextResponse.json(
      { 
        error: 'Missing upload URL',
        headers: Object.fromEntries(headersList.entries()),
        url: request.url
      },
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Content-Range, Authorization, X-Mux-Upload-Url'
        }
      }
    );
  }

  if (!uploadUrl.startsWith('https://')) {
    return NextResponse.json(
      { error: 'Missing upload URL' },
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Content-Range, Authorization, X-Mux-Upload-Url'
        }
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

    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Content-Range, Authorization, X-Mux-Upload-Url'
    };

    return NextResponse.json(
      response.status === 308 
        ? { status: 'processing' }
        : { status: 'complete' },
      {
        status: response.status,
        headers
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
  const headersList = await headers();
  const origin = await headersList.get('origin') || '*';

  return NextResponse.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Content-Range, Authorization, X-Mux-Upload-Url'
    }
  });
}

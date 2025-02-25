import { NextResponse } from 'next/server';
import Mux from "@mux/mux-node";

// Initialize Mux client with environment variables
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
});
const { video } = muxClient;

async function createUpload() {
  // Create a direct upload
  const upload = await video.uploads.create({
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline",
    },
    cors_origin: "*",
  });
  
  // Log the upload details
  console.log('Upload created:', {
    uploadId: upload.id,
    uploadUrl: upload.url
  });
  
  return upload;
}
import { headers } from 'next/headers';

// Helper function to handle POST request (upload initialization)
async function handlePostRequest() {
  const headersList = await headers();
  const origin = headersList.get('origin') || '*';

  try {
    console.log('Starting upload request initialization');
    const upload = await createUpload();

    console.log('Upload created:', {
      uploadId: upload.id,
      uploadUrl: upload.url,
      uploadStatus: upload.status,
      fullResponse: upload
    });

    // The upload.id is actually the upload ID, not the asset ID
    // We need to wait for the asset to be created or use a different approach
    // For now, we'll return both IDs and handle appropriately in the client
    console.log('Sending response with correct ID types:', {
      url: upload.url,
      uploadId: upload.id,
      // The asset ID will be available after the upload completes
      // We'll need to check the upload status to get it
    });

    return NextResponse.json(
      {
        url: upload.url,
        uploadId: upload.id
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

  const headersList = await headers();
  const origin = headersList.get('origin') || '*';
  
  // Get the upload URL from the query parameters
  const requestUrl = new URL(request.url);
  const uploadUrl = requestUrl.searchParams.get('url');
  
  const contentType = headersList.get('content-type');
  const contentLength = headersList.get('content-length');
  const contentRange = headersList.get('content-range');

  console.log('Debug PUT request:', {
    uploadUrl,
    requestUrl: request.url,
    headers: Object.fromEntries(headersList.entries()),
    contentType,
    contentLength,
    contentRange
  });

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

    console.log('Mux upload response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      throw new Error(`Mux upload failed: ${response.status} ${response.statusText}`);
    }

    const responseData = response.status === 308 
      ? { status: 'processing' }
      : { status: 'complete' };

    console.log('Sending response:', responseData);

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

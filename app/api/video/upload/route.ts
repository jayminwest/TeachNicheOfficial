import { NextResponse } from 'next/server';
import { createUpload } from '@/lib/mux';
import { headers } from 'next/headers';

// Helper function to handle both POST and PUT requests
async function handleUploadRequest() {
  const headersList = headers();
  const origin = headersList.get('origin') || '*';

  try {
    console.log('Starting upload request initialization');
    const upload = await createUpload();
    
    if (!upload?.url || !upload?.id) {
      console.error('Invalid Mux upload response:', upload);
      throw new Error('Invalid upload response from Mux');
    }

    console.log('Successfully created Mux upload:', { id: upload.id });

    return new NextResponse(
      JSON.stringify({
        uploadUrl: upload.url,
        assetId: upload.id
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (error) {
    console.error('Video upload initialization error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to initialize video upload. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
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

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

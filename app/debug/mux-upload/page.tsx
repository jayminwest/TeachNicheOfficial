'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useVideoUpload } from '@/app/hooks/use-video-upload';

export default function MuxUploadDebugPage() {
  const router = useRouter();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadId, setUploadId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [activeTab, setActiveTab] = useState('api');
  const [isDev, setIsDev] = useState(false);

  // Initialize the video upload hook
  const {
    status,
    progress,
    error,
    uploadEndpoint,
    initializeUpload,
    handleUploadStart,
    handleUploadProgress,
    handleUploadSuccess,
    handleUploadError,
    reset
  } = useVideoUpload({
    endpoint: '/api/mux/upload',
    onUploadComplete: (assetId) => {
      console.log('Upload complete, asset ID:', assetId);
      setAssetId(assetId);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setApiResponse({ error: error.message, stack: error.stack });
    },
    onProgress: (progress) => {
      console.log('Upload progress:', progress);
    }
  });

  // Function to test the debug API
  const testApi = async (action: string, params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ action, ...params }).toString();
      const response = await fetch(`/api/debug/mux-upload?${queryParams}`);
      const data = await response.json();
      setApiResponse(data);
      
      // If this is a create-upload action and it succeeded, save the upload ID
      if (action === 'create-upload' && data.success && data.data?.uploadId) {
        setUploadId(data.data.uploadId);
      }
      
      // If this is an upload-status action and it succeeded, save the asset ID
      if (action === 'upload-status' && data.success && data.data?.assetId) {
        setAssetId(data.data.assetId);
      }
    } catch (error) {
      setApiResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  // Check if we're in development environment and get API info on page load
  useEffect(() => {
    // This is a client-side check for development mode
    // We'll also verify on the server side in the API route
    const checkDevMode = async () => {
      try {
        const response = await fetch('/api/debug/mux-upload?action=info');
        const data = await response.json();
        
        if (response.status === 403) {
          setIsDev(false);
          // Redirect to home page if not in dev mode
          router.push('/');
          return;
        }
        
        setIsDev(true);
        setApiResponse(data);
      } catch (error) {
        console.error('Error checking dev mode:', error);
        setIsDev(false);
        router.push('/');
      }
    };
    
    checkDevMode();
  }, [router]);

  // Function to handle file selection and upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!uploadEndpoint) {
      alert('Upload endpoint not ready. Status: ' + status);
      return;
    }
    
    handleUploadStart();
    
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadEndpoint, true);
    xhr.setRequestHeader('Content-Type', file.type);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        handleUploadProgress(percentComplete);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Extract upload ID from the endpoint URL
        const url = new URL(uploadEndpoint);
        const pathParts = url.pathname.split('/');
        const uploadId = pathParts[pathParts.length - 1];
        setUploadId(uploadId);
        handleUploadSuccess(uploadId);
      } else {
        handleUploadError(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    
    xhr.onerror = () => {
      handleUploadError(new Error('Network error during upload'));
    };
    
    xhr.send(file);
  };

  // If not in dev mode, don't render anything (we'll redirect)
  if (!isDev) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mux Upload Debug Tool</h1>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
        <p className="font-bold">Development Mode Only</p>
        <p>This debug tool is only available in development environment.</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api">API Testing</TabsTrigger>
          <TabsTrigger value="uploader">Uploader Testing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mux API Debug</CardTitle>
              <CardDescription>Test the Mux API integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => testApi('info')} 
                  disabled={loading}
                  variant="outline"
                >
                  Get API Info
                </Button>
                <Button 
                  onClick={() => testApi('create-upload', { isFree: 'true' })} 
                  disabled={loading}
                  variant="outline"
                >
                  Create Upload URL
                </Button>
                <Button 
                  onClick={() => uploadId && testApi('upload-status', { uploadId })} 
                  disabled={loading || !uploadId}
                  variant="outline"
                >
                  Check Upload Status
                </Button>
                <Button 
                  onClick={() => assetId && testApi('asset-status', { assetId })} 
                  disabled={loading || !assetId}
                  variant="outline"
                >
                  Check Asset Status
                </Button>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Saved IDs:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium">Upload ID:</p>
                    <p className="text-sm font-mono bg-muted p-2 rounded">{uploadId || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Asset ID:</p>
                    <p className="text-sm font-mono bg-muted p-2 rounded">{assetId || 'None'}</p>
                  </div>
                </div>
              </div>
              
              {apiResponse && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">API Response:</h3>
                  <pre className="bg-muted p-4 rounded overflow-auto max-h-96 text-xs">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="uploader" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Uploader Testing</CardTitle>
              <CardDescription>Test the video upload functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Upload Status:</h3>
                  <div className="bg-muted p-4 rounded">
                    <p><strong>Status:</strong> {status}</p>
                    <p><strong>Progress:</strong> {progress}%</p>
                    <p><strong>Error:</strong> {error || 'None'}</p>
                    <p><strong>Endpoint Ready:</strong> {uploadEndpoint ? 'Yes' : 'No'}</p>
                    
                    {status === 'error' && (
                      <Button 
                        onClick={initializeUpload} 
                        className="mt-2"
                        variant="secondary"
                      >
                        Retry Initialization
                      </Button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Upload a Video:</h3>
                  <div className="flex flex-col gap-4">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      disabled={status !== 'ready'}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-primary-foreground
                        hover:file:bg-primary/90"
                    />
                    
                    {status === 'uploading' && (
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={reset} 
                        variant="outline"
                      >
                        Reset Uploader
                      </Button>
                    </div>
                  </div>
                </div>
                
                {(status === 'complete' || status === 'error') && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Result:</h3>
                    <div className="bg-muted p-4 rounded">
                      {status === 'complete' ? (
                        <p className="text-green-600">Upload completed successfully!</p>
                      ) : (
                        <p className="text-red-600">Upload failed: {error}</p>
                      )}
                      
                      {assetId && (
                        <p className="mt-2"><strong>Asset ID:</strong> {assetId}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Note: This is a debug tool for testing the video upload functionality.
                The uploader should initialize automatically. If it doesn't, check the console for errors.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

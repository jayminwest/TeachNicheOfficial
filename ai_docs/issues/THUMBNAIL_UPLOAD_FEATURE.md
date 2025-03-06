# Issue: Implement Thumbnail Upload for Lessons

## Description
We need to implement a thumbnail upload feature for lessons. Currently, the lessons table has a `thumbnail_url` field, but there's no UI or functionality to upload and manage thumbnails. Thumbnails should be stored in a Supabase bucket called `lesson-media/thumbnails`, which is a public bucket.

## Technical Analysis
The lesson form needs to be enhanced to include a thumbnail upload component. This component should:
1. Allow users to upload image files (jpg, png, webp)
2. Store the uploaded files in the Supabase `lesson-media/thumbnails` bucket
3. Generate a public URL for the uploaded thumbnail
4. Save this URL to the `thumbnail_url` field in the lessons table

The implementation should follow our existing patterns for file uploads, as seen in the video upload functionality, but adapted for image files and Supabase storage instead of Mux.

## Affected Files

### Primary Files to Modify:
1. `app/components/ui/lesson-form.tsx` - Add thumbnail upload component to the form
2. Create new file: `app/components/ui/image-uploader.tsx` - Create a reusable image upload component
3. Create new file: `app/hooks/use-image-upload.ts` - Create a hook for handling image uploads
4. Create new API route: `app/api/storage/upload-url/route.ts` - Create an API route for generating upload URLs
5. `app/services/supabase.ts` - Add functions to handle thumbnail uploads to Supabase storage

### Secondary Files to Update:
1. `app/components/ui/lesson-card.tsx` - Ensure thumbnails are displayed correctly
2. `app/components/ui/lesson-preview-dialog.tsx` - Ensure thumbnails are displayed correctly

## Implementation Details

### 1. Create an Image Uploader Component
Create a new component `app/components/ui/image-uploader.tsx` that:
```tsx
// Similar to VideoUploader but for images
interface ImageUploaderProps {
  initialImage?: string;
  onUploadComplete: (url: string) => void;
  onError: (error: Error) => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function ImageUploader({
  initialImage,
  onUploadComplete,
  onError,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className
}: ImageUploaderProps) {
  // Implementation similar to VideoUploader but for images
  // Use the useImageUpload hook for handling the upload logic
}
```

### 2. Create an Image Upload Hook
Create a new hook `app/hooks/use-image-upload.ts` that:
```typescript
interface UseImageUploadOptions {
  bucket?: string;
  folder?: string;
  onUploadComplete?: (url: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function useImageUpload({
  bucket = 'lesson-media',
  folder = 'thumbnails',
  onUploadComplete,
  onError,
  onProgress
}: UseImageUploadOptions = {}) {
  // Implementation for handling image uploads to Supabase storage
  // Similar to useVideoUpload but adapted for Supabase storage
}
```

### 3. Create an API Route for Upload URLs
Create a new API route `app/api/storage/upload-url/route.ts` that:
```typescript
export async function POST(request: Request) {
  try {
    // Authenticate the request using Supabase
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', type: 'auth_error' } },
        { status: 401 }
      );
    }
    
    // Get bucket and folder from request body
    const { bucket, folder } = await request.json();
    
    // Generate a unique filename
    const filename = `${session.user.id}_${Date.now()}.jpg`;
    const path = folder ? `${folder}/${filename}` : filename;
    
    // Generate a signed URL for uploading
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    
    if (error) {
      return NextResponse.json(
        { error: { message: error.message, type: 'storage_error' } },
        { status: 500 }
      );
    }
    
    // Return the signed URL and path
    return NextResponse.json({
      url: data.signedUrl,
      path: data.path,
      bucket: bucket
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: 'Failed to generate upload URL', type: 'server_error' } },
      { status: 500 }
    );
  }
}
```

### 4. Update Supabase Service
Add functions to `app/services/supabase.ts` for handling thumbnail uploads:
```typescript
// Add to existing file
export async function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  
  return getPublicUrl(bucket, data.path);
}
```

### 5. Update Lesson Form
Modify `app/components/ui/lesson-form.tsx` to include the thumbnail uploader:
```tsx
// Add to the form component
<Card className="p-6 mb-6">
  <div className="space-y-4">
    <div>
      <h3 className="font-semibold">Lesson Thumbnail</h3>
      <p className="text-sm text-muted-foreground">
        Upload a thumbnail image for your lesson
      </p>
    </div>
    
    <ImageUploader
      initialImage={form.watch('thumbnailUrl')}
      onUploadComplete={(url) => {
        form.setValue("thumbnailUrl", url, { 
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
        
        toast({
          title: "Thumbnail uploaded",
          description: "Your thumbnail has been uploaded successfully.",
        });
      }}
      onError={(error) => {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      }}
    />
  </div>
</Card>
```

### 6. Update Form Schema
Update the lesson form schema to include the thumbnail URL:
```typescript
const lessonFormSchema = z.object({
  // Existing fields...
  thumbnailUrl: z.string().optional(),
  // Other fields...
});
```

## Testing Requirements
1. Test uploading various image formats (jpg, png, webp)
2. Test uploading images of different sizes and aspect ratios
3. Test replacing an existing thumbnail
4. Test form submission with and without thumbnails
5. Verify thumbnails are publicly accessible
6. Verify thumbnails are displayed correctly in lesson cards and detail views
7. Test error handling (file too large, wrong format, etc.)
8. Test with different user accounts to ensure proper access control

## Acceptance Criteria
1. Users can upload thumbnails when creating or editing lessons
2. Thumbnails are stored in the Supabase `lesson-media/thumbnails` bucket
3. Thumbnail URLs are saved to the `thumbnail_url` field in the lessons table
4. Thumbnails are displayed in lesson cards and detail views
5. The UI provides appropriate feedback during upload (progress, success, errors)
6. The system handles errors gracefully (file too large, wrong format, etc.)
7. Thumbnails are publicly accessible without authentication
8. The implementation follows existing patterns and coding standards

## Additional Context
This feature is important for improving the visual appeal of lessons in the marketplace. Good thumbnails will help attract students to lessons and provide a better browsing experience.

The implementation should leverage Supabase storage capabilities while following our existing patterns for file uploads. Unlike video uploads which use Mux, image uploads will be handled directly by Supabase storage.

## Implementation Approach
1. First, create the image uploader component and hook
2. Then, create the API route for generating upload URLs
3. Next, update the lesson form to include the thumbnail uploader
4. Finally, update the lesson card and preview dialog to display thumbnails

This modular approach allows for testing each component independently before integrating them together.

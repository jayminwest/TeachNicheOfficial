# Feature: Lesson Thumbnail Upload Functionality

## Description
Currently, the lesson creation form lacks the ability for instructors to upload custom thumbnails for their lessons. All lessons are using default or placeholder thumbnails, which reduces visual appeal and makes it difficult for users to distinguish between lessons at a glance.

## Current Behavior
- Lessons are created with default/placeholder thumbnails
- No UI exists for instructors to upload or change thumbnails
- The `thumbnailUrl` field in the lesson object is populated with a generic image or left empty

## Expected Behavior
- Instructors should be able to upload custom thumbnail images during lesson creation
- Existing lessons should have an option to update thumbnails
- Thumbnails should be properly stored, optimized, and served
- Fallback to default thumbnails when none is provided

## Technical Analysis

### Affected Components
- `app/components/ui/lesson-form.tsx`: Needs to be updated to include thumbnail upload functionality
- `app/components/ui/video-uploader.tsx`: Can be referenced for similar upload pattern
- Database schema may need updates to properly store thumbnail metadata

### Implementation Requirements
1. Add image upload component to the lesson form
2. Implement server-side handling for image uploads
3. Add image optimization and processing
4. Update database schema if necessary
5. Implement proper error handling for failed uploads
6. Add validation for image dimensions, size, and format

### Code Examples

Potential implementation in lesson form:
```tsx
// Add to LessonFormProps interface
interface LessonFormProps {
  // existing props...
  initialThumbnail?: string;
}

// Add to form component
const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnailUrl || '');

// Add to form JSX
<FormField
  control={form.control}
  name="thumbnailUrl"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Lesson Thumbnail</FormLabel>
      <FormControl>
        <ImageUploader
          initialImage={thumbnailUrl}
          onUploadComplete={(url) => {
            setThumbnailUrl(url);
            field.onChange(url);
          }}
          onError={(error) => {
            toast({
              title: "Upload failed",
              description: error.message,
              variant: "destructive",
            });
          }}
          maxSizeMB={5}
          acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
        />
      </FormControl>
      <FormDescription>
        Upload a thumbnail image for your lesson (16:9 ratio recommended)
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### API Requirements
- Create a new API endpoint for thumbnail uploads
- Implement secure upload handling with proper validation
- Connect to storage service (Supabase Storage or similar)

## Testing Requirements
- Verify uploads work with various image formats (JPEG, PNG, WebP)
- Test with different image sizes and dimensions
- Verify error handling for invalid files
- Test thumbnail display in lesson cards and detail pages
- Verify mobile responsiveness of upload UI
- Test with slow network connections

## Environment Details
- All environments (development, staging, production)
- All devices (desktop and mobile)
- All modern browsers

## Additional Context
This feature is critical for instructors to properly brand and market their lessons. High-quality, relevant thumbnails significantly impact click-through rates and user engagement.

## Labels
- enhancement
- ui
- storage

## Priority
Medium - Important for instructor experience but not blocking core functionality

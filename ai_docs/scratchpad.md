# Mux Video Integration Plan

## Overview
Integration of Mux video uploading/playback following modular architecture, existing project patterns, and TypeScript-first development approach.

## 1. Component Architecture

### File Structure
```
components/
  ui/
    video-uploader.tsx    # Main upload component with progress
    video-player.tsx      # Mux video player wrapper
    video-status.tsx      # Processing status display
    lesson-form.tsx       # Form with video section
app/
  lessons/
    new/
      page.tsx
    edit/
      [lessonId]/
        page.tsx
    api/
      video/
        upload/route.ts
        status/route.ts
```

## 2. Component Types and Interfaces

```typescript
// components/ui/video-uploader.tsx
interface VideoUploaderProps {
  onUploadComplete: (assetId: string) => void;
  onError: (error: Error) => void;
  className?: string;
}

// components/ui/video-player.tsx
interface VideoPlayerProps {
  playbackId: string;
  title: string;
  className?: string;
}

// components/ui/video-status.tsx
interface VideoStatusProps {
  status: 'pending' | 'processing' | 'ready' | 'error';
  error?: string;
  className?: string;
}

// components/ui/lesson-form.tsx
interface LessonFormProps {
  initialData?: Lesson;
  onSubmit: (data: LessonFormData) => Promise<void>;
  className?: string;
}

interface LessonFormData {
  title: string;
  description: string;
  muxAssetId?: string;
  price?: number;
}
```

## 3. Component Implementation Examples

```typescript
// components/ui/video-uploader.tsx
export function VideoUploader({ onUploadComplete, onError, className }: VideoUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  
  return (
    <div className={cn("relative", className)}>
      <UploadDropzone
        endpoint="/api/video/upload"
        onUploadProgress={setProgress}
        onUploadComplete={onUploadComplete}
        onUploadError={onError}
      />
      <Progress value={progress} className="mt-2" />
      <p className="text-sm text-muted-foreground mt-1">
        {getStatusMessage(status)}
      </p>
    </div>
  );
}

// components/ui/video-player.tsx
export function VideoPlayer({ playbackId, title, className }: VideoPlayerProps) {
  return (
    <div className={cn("aspect-video rounded-lg overflow-hidden", className)}>
      <MuxPlayer
        playbackId={playbackId}
        metadata={{ video_title: title }}
        streamType="on-demand"
      />
    </div>
  );
}

// components/ui/lesson-form.tsx
export function LessonForm({ initialData, onSubmit, className }: LessonFormProps) {
  const form = useForm<LessonFormData>({
    defaultValues: initialData,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <VideoUploader
          onUploadComplete={(assetId) => form.setValue('muxAssetId', assetId)}
          onError={(error) => toast.error(error.message)}
        />
        <Button type="submit">Save Lesson</Button>
      </form>
    </Form>
  );
}
```

## 4. Implementation Phases

### Phase 1: Core Setup
- [ ] Add Mux dependencies
- [ ] Configure environment variables
- [ ] Set up type definitions
- [ ] Create base components structure

### Phase 2: Atomic Components
- [ ] Implement atom-level components with tests
- [ ] Add accessibility features
- [ ] Create Storybook stories
- [ ] Add error boundaries

### Phase 3: Video Management
- [ ] Implement VideoContext
- [ ] Create upload flow
- [ ] Add status polling
- [ ] Implement error handling
- [ ] Add video player integration

### Phase 4: Form Integration
- [ ] Create form components
- [ ] Add validation
- [ ] Implement save/update flow
- [ ] Add loading states

### Phase 5: Auth & Permissions
- [ ] Integrate with AuthContext
- [ ] Add permission checks
- [ ] Implement RLS policies
- [ ] Add error handling

## 5. Error Handling

### Error Boundaries
```typescript
class VideoErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />
    }
    return this.props.children
  }
}
```

### Error States
- Upload failures (network/validation)
- Processing errors (Mux-specific)
- Permission errors
- Validation errors
- Timeout handling

## 7. Database Schema

```sql
-- Add Mux support to lessons
alter table lessons 
  add column mux_asset_id text,
  add column mux_playback_id text,
  add column video_status text default 'pending';

-- RLS Policies
alter policy "lesson_access_policy" 
  on lessons 
  using (
    auth.uid() = creator_id 
    or status = 'published'
    or exists (
      select 1 from purchases 
      where lesson_id = lessons.id 
      and user_id = auth.uid()
    )
  );

-- Status trigger
create function on_video_status_change() returns trigger as $$
begin
  if NEW.video_status = 'ready' and OLD.video_status != 'ready' then
    perform notify_lesson_ready(NEW.id);
  end if;
  return NEW;
end;
$$ language plpgsql;
```

## 8. Performance Optimization

### Lazy Loading
```typescript
const VideoPlayer = dynamic(() => import('./VideoPlayer'), {
  loading: () => <VideoPlayerSkeleton />,
  ssr: false
})
```

### Caching Strategy
- Cache video metadata
- Implement stale-while-revalidate
- Use Next.js ISR for lesson pages

## 9. Security Measures
- Implement upload URL signing
- Add file type validation
- Set size limits
- Configure CORS
- Add rate limiting
- Implement proper auth checks

## 10. Monitoring
- Track upload success rates
- Monitor processing times
- Watch error patterns
- Track performance metrics
- Monitor quota usage

## Dependencies
```bash
npm install @mux/mux-node @mux/mux-player-react @mux/mux-uploader-react
```

## Environment Variables
```
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
NEXT_PUBLIC_MUX_ENV_KEY=your_env_key
```

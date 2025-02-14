# Mux Video Integration Plan

## Overview
Integration of Mux video uploading/playback following modular architecture, existing project patterns, and TypeScript-first development approach.

## 1. Component Architecture

### File Structure
```
app/
  lessons/
    _components/
      video/
        atoms/
          UploadButton.tsx
          ProgressBar.tsx
          VideoThumbnail.tsx
          ErrorDisplay.tsx
        molecules/
          UploadStatus.tsx
          VideoPlayer.tsx
          UploadForm.tsx
        organisms/
          VideoUploader.tsx
          VideoManager.tsx
      form/
        atoms/
          FormField.tsx
          ValidationMessage.tsx
        molecules/
          VideoSection.tsx
          MetadataSection.tsx
        organisms/
          LessonForm.tsx
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

## 2. Type Definitions

```typescript
// types/video.ts
export interface MuxAsset {
  id: string;
  status: 'preparing' | 'ready' | 'errored';
  playbackId?: string;
  errors?: Array<{
    type: string;
    message: string;
  }>;
}

export interface UploadState {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: Error;
}

// types/lesson.ts
export interface Lesson {
  id: string;
  title: string;
  description: string;
  muxAssetId?: string;
  muxPlaybackId?: string;
  videoStatus: 'pending' | 'processing' | 'ready' | 'error';
  creatorId: string;
}
```

## 3. State Management

```typescript
// contexts/VideoContext.tsx
interface VideoContextState {
  asset: MuxAsset | null;
  uploadState: UploadState;
  error: Error | null;
}

interface VideoContextActions {
  startUpload: (file: File) => Promise<void>;
  retryUpload: () => Promise<void>;
  resetState: () => void;
}

const VideoContext = createContext<{
  state: VideoContextState;
  actions: VideoContextActions;
}>(null!);

export const useVideo = () => useContext(VideoContext);
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

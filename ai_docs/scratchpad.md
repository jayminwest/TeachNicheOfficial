# Mux Video Integration Plan

## Overview
Integration of Mux video uploading/playback for lesson creation and editing, following modular architecture and existing project patterns.

## 1. Dependencies
```bash
npm install @mux/mux-node @mux/mux-player-react @mux/mux-uploader-react
```

## 2. Environment Setup
Add to .env.local:
```
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
```

## 3. File Structure
```
app/
  lessons/
    new/
      page.tsx         # Create new lesson page
    edit/
      [lessonId]/
        page.tsx       # Edit existing lesson page
    _components/       # Shared components
      LessonForm/
        index.tsx      # Main form wrapper
        schema.ts      # Zod validation schema
      VideoUploader/
        index.tsx      # Container component
        MuxUploader.tsx     # Upload wrapper
        AssetStatus.tsx     # Processing status
        MuxPlayer.tsx       # Video player
        types.ts           # Shared types
      PermissionGuard.tsx  # Auth HOC
    api/
      video-upload/
        route.ts      # Upload endpoint
      video-status/
        route.ts      # Status check endpoint
```

## 4. Implementation Phases

### Phase 1: Core Components
- [ ] Set up file structure
- [ ] Create basic component shells
- [ ] Add Mux dependencies
- [ ] Configure environment variables

### Phase 2: Video Upload Flow
- [ ] Implement MuxUploader component
- [ ] Create upload API endpoint
- [ ] Add upload status polling
- [ ] Basic error handling

### Phase 3: Lesson Form 
- [ ] Create form schema
- [ ] Implement form components
- [ ] Add video upload container
- [ ] Connect form to API

### Phase 4: Edit Flow 
- [ ] Add edit page
- [ ] Implement video replacement
- [ ] Handle existing video playback
- [ ] Update API endpoints

### Phase 5: Auth & Permissions
- [ ] Add PermissionGuard
- [ ] Implement ownership checks
- [ ] Update database schema
- [ ] Add RLS policies

### Phase 6: Testing & Polish
- [ ] Add component tests
- [ ] Add API tests
- [ ] Error handling
- [ ] Loading states
- [ ] UI polish

## 5. Database Schema Updates

```sql
-- Modify existing lessons table to support Mux
alter table lessons 
  add column mux_asset_id text,
  add column mux_playback_id text,
  add column mux_upload_id text,
  add column video_status text default 'pending';

-- Drop existing Vimeo columns (after migration)
-- alter table lessons 
--   drop column vimeo_video_id,
--   drop column vimeo_url;

-- Update RLS policies
alter policy "Users can view their own lessons" 
  on lessons 
  using (
    auth.uid() = creator_id 
    or status = 'published'
    or exists (
      select 1 from purchases 
      where purchases.lesson_id = lessons.id 
      and purchases.user_id = auth.uid()
    )
  );

alter policy "Users can update their own lessons" 
  on lessons 
  using (auth.uid() = creator_id);

-- Add function to handle video status updates
create or replace function handle_video_status_change()
returns trigger as $$
begin
  if NEW.video_status = 'ready' and OLD.video_status != 'ready' then
    -- Could trigger notifications or other actions
    NEW.updated_at = now();
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger video_status_change
  before update on lessons
  for each row
  when (NEW.video_status is distinct from OLD.video_status)
  execute function handle_video_status_change();
```

## 6. Testing Strategy

### Component Tests
```typescript
// VideoUploader
describe('VideoUploader', () => {
  it('handles new upload')
  it('shows existing video')
  it('handles replace flow')
  it('shows upload errors')
});

// LessonForm
describe('LessonForm', () => {
  it('validates required fields')
  it('handles video upload')
  it('submits successfully')
});
```

### API Tests
```typescript
describe('video-upload', () => {
  it('requires authentication')
  it('creates upload URL')
  it('handles Mux errors')
});
```

## 7. Error Handling
- Upload failures
- Processing errors
- Network issues
- Permission denied
- Invalid file types
- File size limits

## 8. Performance Considerations
- Optimize video player loading
- Implement lazy loading
- Handle large file uploads
- Consider CDN configuration
- Monitor Mux usage/quotas

## 9. Security Checklist
- [ ] Validate file types
- [ ] Set upload size limits
- [ ] Configure CORS properly
- [ ] Implement proper auth checks
- [ ] Secure API endpoints
- [ ] Add rate limiting
- [ ] Monitor usage patterns

## 10. Deployment Steps
1. Set up Mux account
2. Configure environment variables
3. Update database schema
4. Deploy API changes
5. Test upload flow
6. Monitor error rates
7. Check video processing
8. Verify permissions

## 11. Monitoring Plan
- Track upload success rates
- Monitor video processing times
- Watch for error patterns
- Check auth failures
- Monitor API performance
- Track Mux quota usage

## Next Steps
1. Begin with Phase 1 implementation
2. Set up project board
3. Create initial PRs
4. Schedule review meetings
5. Plan testing strategy

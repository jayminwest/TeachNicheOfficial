# Video Integration Standards

## Mux Integration

### Configuration
```typescript
// services/mux.ts
import Mux from '@mux/mux-node'

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
})
```

### Upload Handling
```typescript
interface UploadOptions {
  maxSizeMB?: number
  acceptedTypes?: string[]
  onProgress?: (progress: number) => void
  onComplete?: (assetId: string) => void
  onError?: (error: Error) => void
}

export function VideoUploader({
  maxSizeMB = 500,
  acceptedTypes = ['video/mp4', 'video/quicktime'],
  onProgress,
  onComplete,
  onError
}: UploadOptions) {
  return (
    <MuxUploader
      endpoint="/api/mux/upload-url"
      onUploadProgress={onProgress}
      onSuccess={onComplete}
      onError={onError}
    />
  )
}
```

### Playback Configuration
```typescript
interface PlaybackConfig {
  playbackId: string
  title: string
  poster?: string
  startTime?: number
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
}

export function VideoPlayer({
  playbackId,
  title,
  ...config
}: PlaybackConfig) {
  return (
    <MuxPlayer
      streamType="on-demand"
      playbackId={playbackId}
      metadata={{ video_title: title }}
      {...config}
    />
  )
}
```

## Video Processing

### Asset Management
```typescript
async function createVideoAsset(uploadId: string) {
  const asset = await mux.video.assets.create({
    input: [{
      url: `https://storage.muxcdn.com/${uploadId}`,
    }],
    playback_policy: ['public'],
    test: process.env.NODE_ENV !== 'production'
  })
  
  return asset
}
```

### Status Tracking
```typescript
type VideoStatus = 'preparing' | 'ready' | 'errored'

function useVideoStatus(assetId: string) {
  const [status, setStatus] = useState<VideoStatus>('preparing')
  
  useEffect(() => {
    const checkStatus = async () => {
      const asset = await mux.video.assets.get(assetId)
      setStatus(asset.status)
    }
    
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [assetId])
  
  return status
}
```

## Analytics

### View Tracking
```typescript
function VideoAnalytics({ assetId }: { assetId: string }) {
  useEffect(() => {
    const monitor = muxjs.monitor('#video-player', {
      data: {
        env_key: process.env.NEXT_PUBLIC_MUX_ENV_KEY,
        video_id: assetId,
        video_title: title,
        viewer_user_id: userId
      }
    })

    return () => monitor.destroy()
  }, [assetId])
}
```

### Performance Monitoring
```typescript
interface VideoMetrics {
  playbackSuccess: number
  rebufferCount: number
  startupTime: number
  videoStartFailure: number
}

function trackVideoMetrics(metrics: VideoMetrics) {
  analytics.track('video_playback', {
    ...metrics,
    timestamp: new Date().toISOString()
  })
}
```

## Error Handling

### Upload Errors
```typescript
async function handleUploadError(error: Error) {
  logger.error('Video upload failed:', {
    error: error.message,
    timestamp: new Date().toISOString()
  })
  
  // Notify user
  toast.error('Failed to upload video. Please try again.')
}
```

### Playback Errors
```typescript
function handlePlaybackError(error: Error) {
  logger.error('Video playback failed:', {
    error: error.message,
    timestamp: new Date().toISOString()
  })
  
  // Show fallback content
  return (
    <div className="video-error">
      <p>Unable to play video. Please try again later.</p>
    </div>
  )
}
```

## Testing

### Mock Video Player
```typescript
function MockVideoPlayer({ playbackId }: { playbackId: string }) {
  return (
    <div data-testid="mock-video-player">
      <p>Mock Video Player: {playbackId}</p>
    </div>
  )
}

// In tests
jest.mock('@/components/VideoPlayer', () => MockVideoPlayer)
```

### Upload Testing
```typescript
describe('VideoUploader', () => {
  it('handles successful upload', async () => {
    const onComplete = jest.fn()
    render(<VideoUploader onComplete={onComplete} />)
    
    // Simulate upload
    await uploadTestFile('test-video.mp4')
    
    expect(onComplete).toHaveBeenCalledWith(expect.any(String))
  })
})
```

## Security

### Access Control
- Implement signed URLs for private videos
- Use secure tokens for playback
- Validate upload permissions
- Monitor for abuse

### Content Protection
- Enable DRM when needed
- Implement watermarking
- Use signed playback tokens
- Monitor for piracy

## Performance

### Optimization
- Use adaptive bitrate streaming
- Enable lazy loading
- Implement proper caching
- Monitor bandwidth usage

### Best Practices
- Compress videos appropriately
- Use thumbnail previews
- Implement proper preloading
- Monitor viewer experience

## Documentation

### Integration Guide
- Setup instructions
- API reference
- Common issues
- Best practices

### Monitoring Guide
- Performance metrics
- Error tracking
- Usage analytics
- Cost optimization

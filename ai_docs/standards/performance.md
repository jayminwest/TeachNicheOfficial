# Performance Standards

## Core Web Vitals

### Metrics Monitoring
```typescript
// lib/monitoring/web-vitals.ts
import { onCLS, onFID, onLCP } from 'web-vitals'

function sendToAnalytics(metric: any) {
  const body = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    page: window.location.pathname,
  }
  
  navigator.sendBeacon('/api/metrics', JSON.stringify(body))
}

export function reportWebVitals() {
  onCLS(sendToAnalytics)
  onFID(sendToAnalytics)
  onLCP(sendToAnalytics)
}
```

### Performance Goals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTI (Time to Interactive): < 3.8s
- TBT (Total Blocking Time): < 200ms

## Image Optimization

### Next.js Image Component
```typescript
import Image from 'next/image'

function OptimizedImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL={getBlurDataUrl(src)}
      priority={isPriority(src)}
    />
  )
}
```

### Image Loading Strategy
- Use appropriate sizes
- Enable lazy loading
- Implement blur placeholder
- Prioritize above-fold images
- Use modern formats (WebP)

## Code Splitting

### Dynamic Imports
```typescript
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  loading: () => <VideoPlayerSkeleton />,
  ssr: false
})
```

### Route-Based Splitting
- Leverage Next.js automatic code splitting
- Use dynamic imports for large components
- Implement proper loading states
- Monitor chunk sizes

## Caching Strategy

### Browser Caching
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

### API Response Caching
```typescript
export async function GET() {
  const cacheKey = 'lessons:featured'
  const cached = await redis.get(cacheKey)
  
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    })
  }
  
  const data = await getFeaturedLessons()
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 60)
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  })
}
```

## Bundle Optimization

### Bundle Analysis
```bash
# package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

### Size Monitoring
- Track bundle sizes in CI
- Set size limits
- Monitor dependencies
- Remove unused code

## Database Performance

### Query Optimization
- Use appropriate indexes
- Optimize joins
- Implement caching
- Monitor query times

### Connection Management
```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

## Client-Side Performance

### React Optimization
```typescript
// Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => b.price - a.price)
}, [items])

// Memoize callbacks
const handleSubmit = useCallback(() => {
  // Handle submission
}, [dependencies])

// Memoize components
const MemoizedComponent = memo(Component)
```

### State Management
- Use appropriate state solutions
- Implement proper memoization
- Monitor re-renders
- Optimize context usage

## Testing

### Performance Testing
```typescript
describe('Performance', () => {
  it('renders list within performance budget', async () => {
    const startTime = performance.now()
    render(<LargeList items={items} />)
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(100)
  })
})
```

### Load Testing
```typescript
import { check } from 'k6/http'

export default function() {
  const res = http.get('https://api.example.com/lessons')
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200
  })
}
```

## Monitoring

### Performance Monitoring
```typescript
function trackPerformanceMetric(
  name: string,
  value: number,
  tags: Record<string, string>
) {
  analytics.track('performance_metric', {
    name,
    value,
    ...tags,
    timestamp: new Date().toISOString()
  })
}
```

### Error Tracking
```typescript
function trackPerformanceError(error: Error, context?: Record<string, unknown>) {
  logger.error('Performance error:', {
    error: error.message,
    code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })
}
```

## Best Practices

### Loading States
- Implement proper skeletons
- Show progress indicators
- Handle timeout errors
- Provide feedback

### Error Boundaries
```typescript
class PerformanceErrorBoundary extends React.Component {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    trackPerformanceError(error, info)
  }
  
  render() {
    return this.props.children
  }
}
```

### Resource Hints
```html
<link rel="preconnect" href="https://api.example.com">
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>
```

### Performance Checklist
- Optimize images
- Minimize JavaScript
- Enable compression
- Use CDN
- Implement caching
- Monitor metrics
- Test performance
- Handle errors

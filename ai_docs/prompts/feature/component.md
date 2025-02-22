# Feature Component Development Prompts

## Initial Analysis

```typescript
interface ComponentAnalysis {
  type: 'atom' | 'molecule' | 'organism';
  complexity: 'simple' | 'medium' | 'complex';
  requirements: {
    props: string[];
    state: boolean;
    effects: boolean;
    children: boolean;
  };
}
```

## Development Prompts

### Structure Planning
1. "Analyze the component requirements and suggest an atomic design classification"
2. "Identify potential reusable sub-components"
3. "Determine required props and state management"

### Implementation
1. "Review the component structure for modularity"
2. "Suggest appropriate Shadcn UI components"
3. "Verify proper prop typing and validation"

### Testing
1. "Generate test cases for core functionality"
2. "Identify edge cases requiring testing"
3. "Suggest accessibility test scenarios"

## Review Checklist

- [ ] Component follows atomic design principles
- [ ] Props are properly typed
- [ ] Tests cover core functionality
- [ ] Documentation is complete
- [ ] Accessibility is implemented
- [ ] Performance is optimized

# AI Code Review Prompts

## Review Configuration

```typescript
interface CodeReviewConfig {
  type: 'feature' | 'fix' | 'refactor';
  focus: ('security' | 'performance' | 'quality' | 'testing')[];
  depth: 'basic' | 'detailed' | 'comprehensive';
}
```

## Review Prompts

### Code Quality
1. "Analyze type safety and TypeScript usage"
2. "Review component structure and modularity"
3. "Check for code duplication and reuse opportunities"
4. "Verify error handling and edge cases"

### Performance
1. "Identify potential performance bottlenecks"
2. "Review React rendering optimization"
3. "Check bundle size impact"
4. "Analyze data fetching patterns"

### Security
1. "Review authentication implementation"
2. "Check for security vulnerabilities"
3. "Verify input validation"
4. "Analyze API security"

### Testing
1. "Review test coverage and quality"
2. "Identify missing test cases"
3. "Check edge case coverage"
4. "Verify integration test scenarios"

## Review Checklist

Quality:
- [ ] Type safety verified
- [ ] Code style consistent
- [ ] Documentation complete
- [ ] Error handling robust

Performance:
- [ ] No unnecessary renders
- [ ] Optimized data fetching
- [ ] Bundle size acceptable
- [ ] Memory usage efficient

Security:
- [ ] Authentication proper
- [ ] Input validated
- [ ] XSS prevented
- [ ] CSRF protected

Testing:
- [ ] Coverage sufficient
- [ ] Edge cases tested
- [ ] Integration verified
- [ ] Performance tested

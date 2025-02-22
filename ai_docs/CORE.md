# Core Development System

This document defines the core types and interfaces for our adaptive development system. It serves as the single source of truth for workflow configurations and quality standards.

## Core Types

```typescript
/**
 * Primary configuration interface for all workflow changes
 */
interface WorkflowConfig {
  // Type of change being made
  changeType: 'feature' | 'fix' | 'docs' | 'refactor';
  
  // Complexity level of the change
  complexity: 'simple' | 'medium' | 'complex';
  
  // Urgency level for processing
  urgency: 'normal' | 'urgent';
  
  // Scope of the change
  scope: {
    // System areas affected by the change
    affects: ('ui' | 'api' | 'db' | 'auth' | 'payment' | 'video')[];
    
    // Required testing levels
    testingRequired: ('unit' | 'integration' | 'e2e' | 'performance' | 'accessibility')[];
  };
}

/**
 * Testing configuration and requirements
 */
interface TestingConfig {
  testTypes: ('unit' | 'integration' | 'e2e' | 'accessibility')[];
  coverageThresholds: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  location: string;
  utilities: {
    render: string;
    mocks: string;
  };
}

/**
 * Component configuration following Atomic Design
 */
interface ComponentConfig {
  type: 'atom' | 'molecule' | 'organism' | 'template' | 'page';
  useShadcn: boolean;
  requiresAuth?: boolean;
  accessibility: {
    wcagLevel: 'A' | 'AA' | 'AAA';
    ariaRequired: boolean;
  };
}

/**
 * Quality gate definition for workflow stages
 */
interface QualityGate {
  // Gate identifier
  name: string;
  
  // Required checks for this gate
  checks: string[];
  
  // Pass/fail threshold (0-100)
  threshold: number;
  
  // Whether failing this gate blocks progression
  blocking: boolean;
}

/**
 * Branch progression definition
 */
interface WorkflowStage {
  // Branch name
  branch: string;
  
  // Required quality gates
  gates: QualityGate[];
  
  // Next possible stages
  nextStages: string[];
  
  // Whether human review is required
  requiresReview: boolean;
}
```

## Core Functions

```typescript
/**
 * Determines the workflow path based on configuration
 */
function determineWorkflowPath(config: WorkflowConfig): string[] {
  if (config.urgency === 'urgent' && config.changeType === 'fix') {
    return ['hotfix', 'main'];  // Emergency path
  }
  
  if (config.complexity === 'simple' && config.scope.affects.includes('ui')) {
    return ['feature', 'dev', 'main'];  // Skip staging for simple UI
  }
  
  return ['feature', 'dev', 'staging', 'main'];  // Full path
}

/**
 * Gets required quality gates for a stage
 */
function getQualityGates(stage: string, config: WorkflowConfig): QualityGate[] {
  // Implementation defined in checks/quality-gates.md
  return [];
}

/**
 * Determines automation level for a change
 */
function getAutomationLevel(config: WorkflowConfig): 'full' | 'assisted' | 'manual' {
  if (config.complexity === 'simple' && config.changeType !== 'fix') {
    return 'full';
  }
  
  if (config.urgency === 'urgent' || config.complexity === 'complex') {
    return 'manual';
  }
  
  return 'assisted';
}
```

## Technology Stack Requirements

1. TypeScript Standards
- Strict TypeScript configuration
- No 'any' types allowed
- All props and returns explicitly typed
- No type assertions without validation
- Use TypeScript for enhanced code maintainability

2. React & Next.js
- Functional components with hooks
- Next.js app router conventions
- Server-side rendering optimization
- API routes following Next.js patterns
- Clean code principles and SOLID

3. Shadcn UI Implementation
- Use Shadcn UI components by default
- Consistent component customization
- Maintain design system integrity
- Minimal custom component creation

4. Supabase Integration
- Typed database interactions
- Secure authentication flows
- Real-time subscriptions when needed
- Efficient query patterns

## Quality Standards

1. Type Safety
- No use of 'any' types
- All props and returns typed
- No type assertions without validation
- Interface-first development

2. Testing
- Unit tests for all new code
- Integration tests for API changes
- E2E tests for user flows
- Coverage requirements per complexity:
  - Simple: 80%
  - Medium: 90%
  - Complex: 100%
- Tests co-located with source files
- Use provided test utilities

3. Documentation
- JSDoc for exported functions
- README updates for features
- API documentation for endpoints
- Change documentation in commits
- Component usage examples

4. Performance
- No unnecessary re-renders
- Optimized data fetching
- Bundle size monitoring
- Performance testing for complex changes
- Core Web Vitals optimization

5. Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML structure
- ARIA attributes where needed
- Keyboard navigation support
- Screen reader testing

6. Security
- Input validation with Zod
- XSS prevention
- CSRF protection
- Secure authentication flows
- API route protection

## Directory Structure

```
ai_docs/
├── CORE.md              # This file
├── workflows/           # Workflow definitions
│   ├── feature.md      # Feature development
│   ├── fix.md          # Bug fixes
│   ├── docs.md         # Documentation
│   └── refactor.md     # Refactoring
├── checks/             # Quality checks
│   ├── typescript.md   # Type checking
│   ├── testing.md      # Testing
│   ├── security.md     # Security
│   └── performance.md  # Performance
├── standards/          # Implementation standards
│   ├── components.md   # Component standards
│   ├── testing.md      # Testing standards
│   ├── security.md     # Security standards
│   └── api.md          # API standards
└── prompts/           # AI guidance
    ├── feature/       # Feature prompts
    ├── fix/           # Fix prompts
    └── review/        # Review prompts
```

## Service Integration

### Supabase Integration
- Initialize client in dedicated file
- Type-safe database operations
- Real-time subscription patterns
- Secure authentication flows
- Row Level Security implementation

### Stripe Connect
- Version: 2025-01-27.acacia
- Secure payment processing
- Webhook handling in Edge Functions
- Connect account management
- Payout system integration

### Mux Video
- Video upload optimization
- Streaming implementation
- Analytics integration
- Error handling patterns
- Playback optimization

### Authentication
- Supabase Auth implementation
- Protected route patterns
- Role-based access control
- Session management
- Security best practices

## Workflow Progression

Changes follow this general progression:

1. Initial Configuration
- Determine change type
- Assess complexity
- Define scope
- Set urgency

2. Path Determination
- Calculate workflow path
- Identify quality gates
- Set automation level

3. Stage Progression
- Meet quality gates
- Pass reviews if required
- Automated testing
- Documentation updates

4. Completion
- Final quality checks
- Merge approval
- Deployment
- Monitoring

Each stage's specific requirements are defined in the respective workflow documents.

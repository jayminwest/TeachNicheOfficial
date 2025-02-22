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
    affects: ('ui' | 'api' | 'db' | 'auth' | 'payment')[];
    
    // Required testing levels
    testingRequired: ('unit' | 'integration' | 'e2e' | 'performance')[];
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

## Quality Standards

Every change must meet these base requirements regardless of type:

1. Type Safety
- No use of 'any' types
- All props and returns typed
- No type assertions without validation

2. Testing
- Unit tests for all new code
- Integration tests for API changes
- E2E tests for user flows
- Coverage requirements per complexity:
  - Simple: 70%
  - Medium: 80%
  - Complex: 90%

3. Documentation
- JSDoc for exported functions
- README updates for features
- API documentation for endpoints
- Change documentation in commits

4. Performance
- No unnecessary re-renders
- Optimized data fetching
- Bundle size monitoring
- Performance testing for complex changes

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
└── prompts/           # AI guidance
    ├── feature/       # Feature prompts
    ├── fix/           # Fix prompts
    └── review/        # Review prompts
```

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

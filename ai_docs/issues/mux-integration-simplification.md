# Issue: Simplify Mux Integration Using TEMP_MUX_EXAMPLE Template

## Problem Statement

The current Mux integration has become overly complex and unreliable. We have a simpler, working template (TEMP_MUX_EXAMPLE) in our codebase that should be used as the foundation for our production implementation.

## Technical Analysis

Our current implementation suffers from:
- Overly complex singleton pattern in `app/services/mux.ts`
- Excessive error handling and retry logic in `app/hooks/use-video-upload.ts`
- Inconsistent status tracking between components
- Multiple authentication approaches across test files
- Global state management via window objects
- Complex polling instead of webhooks

The TEMP_MUX_EXAMPLE template demonstrates a much cleaner approach that follows Mux's recommended patterns.

## Proposed Solution

1. **Remove complexity** by replacing our current server-side implementation with the simpler approach from TEMP_MUX_EXAMPLE
2. **Preserve UI components** in `app/components/ui/` which are well-designed
3. **Standardize status types** across the application
4. **Simplify API routes** for upload, status checking, and playback

## Implementation Plan

### Files to Remove
- `app/services/mux.ts` (replace with direct Mux client initialization)
- Multiple test files with different authentication approaches
- Any redundant API routes

### Files to Simplify
- `app/hooks/use-video-upload.ts` (remove excessive error handling)
- `app/lessons/asset/[assetId]/types.ts` (standardize with template)

### Template Files to Adapt
- `TEMP_MUX_EXAMPLE/app/(upload)/asset/[assetId]/page.tsx`
- `TEMP_MUX_EXAMPLE/app/(upload)/asset/[assetId]/types.ts`
- `TEMP_MUX_EXAMPLE/app/(upload)/page.tsx`

## Success Criteria
- Simplified codebase with fewer files
- Reliable video upload and playback
- Consistent error handling
- Proper status tracking
- Working integration with existing UI components

## Priority
High - This is blocking reliable video functionality

## Labels
- bug
- enhancement
- technical-debt

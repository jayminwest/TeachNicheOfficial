# Documentation Updates for GCP Migration

## Issue Type
- [x] Documentation
- [ ] Bug
- [ ] Enhancement
- [ ] Security
- [ ] Performance

## Priority
- [x] High
- [ ] Medium
- [ ] Low

## Description
This issue outlines the comprehensive documentation updates needed to reflect our migration from Supabase to Google Cloud Platform (GCP). All documentation should be updated to remove Supabase references and include accurate information about our GCP infrastructure.

## Motivation
As we've migrated our infrastructure from Supabase to Google Cloud Platform, our documentation needs to be updated to:

1. Provide accurate guidance for developers
2. Reflect our current architecture and technology stack
3. Remove outdated references to Supabase
4. Include new information about GCP services and configurations
5. Update all code examples to use GCP services instead of Supabase

## Current Status
We've already updated the core documentation files in `ai_docs/core/` to reflect the migration to GCP. However, many other documentation files still contain references to Supabase and need to be updated.

## Required Updates

### Core Documentation (Completed)
- [x] Update GLOSSARY.md to add GCP entry
- [x] Update GETTING_STARTED.md to reflect GCP prerequisites and setup
- [x] Update OVERVIEW.md to reflect GCP in technology stack
- [x] Update DOCUMENTATION_USAGE.md to include GCP references
- [x] Update ARCHITECTURE.md to reflect GCP architecture

### Guides Documentation
- [ ] Update DATABASE_SETUP.md to reflect Cloud SQL instead of Supabase
- [ ] Update AUTHENTICATION.md to reflect Firebase Authentication
- [ ] Update STORAGE.md to reflect Firebase Storage / Cloud Storage
- [ ] Create new GCP_SETUP.md guide for GCP project setup
- [ ] Create new FIREBASE_SETUP.md guide for Firebase project setup
- [ ] Update API_INTEGRATION.md to reflect GCP services
- [ ] Update DEPLOYMENT.md to include GCP deployment considerations
- [ ] Update TESTING.md to reflect testing with GCP services

### Standards Documentation
- [ ] Update API_STANDARDS.md to reflect GCP API patterns
- [ ] Update SECURITY_STANDARDS.md to include GCP security best practices
- [ ] Update DATABASE_STANDARDS.md to reflect Cloud SQL practices
- [ ] Update AUTHENTICATION_STANDARDS.md to reflect Firebase Authentication

### Reference Documentation
- [ ] Update DATABASE_SCHEMA.md to reflect Cloud SQL schema
- [ ] Create new GCP_SERVICES.md reference for GCP services used
- [ ] Create new FIREBASE_AUTHENTICATION.md reference
- [ ] Create new CLOUD_STORAGE.md reference
- [ ] Update ENVIRONMENT_VARIABLES.md to reflect GCP environment variables

### Process Documentation
- [ ] Update DEPLOYMENT_PROCESS.md to include GCP deployment steps
- [ ] Update BACKUP_PROCESS.md to reflect GCP backup procedures
- [ ] Update MONITORING_PROCESS.md to include GCP monitoring tools

### Templates Documentation
- [ ] Update API_TEMPLATE.md to reflect GCP API patterns
- [ ] Update SERVICE_TEMPLATE.md to include GCP service patterns

## Files to Remove
- [ ] `ai_docs/guides/SUPABASE_SMTP_SETUP.md` (confirmed exists)
- [ ] SUPABASE_SETUP.md (if exists)
- [ ] SUPABASE_CLI.md (if exists)
- [ ] SUPABASE_MIGRATION.md (if exists)
- [ ] Any other Supabase-specific documentation files

## Files to Create
- [ ] `ai_docs/guides/GCP_SETUP.md`
- [ ] `ai_docs/guides/FIREBASE_SETUP.md`
- [ ] `ai_docs/guides/GOOGLE_WORKSPACE_EMAIL.md` (to replace SUPABASE_SMTP_SETUP.md)
- [ ] `ai_docs/reference/GCP_SERVICES.md`
- [ ] `ai_docs/reference/FIREBASE_AUTHENTICATION.md`
- [ ] `ai_docs/reference/CLOUD_STORAGE.md`

## Implementation Plan

### Phase 1: Audit and Inventory (1-2 days)
- [ ] Run a comprehensive search for "supabase" across all documentation files
- [ ] Create a detailed inventory of all files that need updates
- [ ] Prioritize files based on developer usage frequency
- [ ] Create a detailed plan for each file update

### Phase 2: Core Updates (2-3 days)
- [x] Update core documentation files (COMPLETED)
- [ ] Update high-priority guides (DATABASE_SETUP.md, AUTHENTICATION.md, STORAGE.md)
- [ ] Create essential new guides (GCP_SETUP.md, FIREBASE_SETUP.md)
- [ ] Update critical reference documentation (DATABASE_SCHEMA.md, ENVIRONMENT_VARIABLES.md)

### Phase 3: Comprehensive Updates (3-4 days)
- [ ] Update all remaining guides
- [ ] Update all standards documentation
- [ ] Update all process documentation
- [ ] Update all templates
- [ ] Create all remaining new documentation files

### Phase 4: Review and Validation (1-2 days)
- [ ] Conduct peer review of all updated documentation
- [ ] Verify accuracy of GCP-specific information
- [ ] Ensure consistency across all documentation
- [ ] Validate code examples work with GCP services
- [ ] Remove any obsolete Supabase-specific files

## Technical Details

### Common Replacements
The following replacements will be needed across multiple files:

1. Supabase client initialization → Firebase/GCP client initialization
2. Supabase authentication → Firebase Authentication
3. Supabase storage → Firebase Storage / Cloud Storage
4. Supabase database queries → Cloud SQL queries
5. Supabase environment variables → GCP environment variables

### Environment Variables Updates
Update references from:
- `NEXT_PUBLIC_SUPABASE_URL` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_FIREBASE_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` → `GOOGLE_APPLICATION_CREDENTIALS`
- `SUPABASE_JWT_SECRET` → `FIREBASE_AUTH_EMULATOR_HOST` (for local development)

### Code Example Updates
All code examples need to be updated from Supabase to equivalent GCP implementations:

#### Authentication Example
From:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'example@email.com',
  password: 'example-password',
});
```

To:
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';

const userCredential = await signInWithEmailAndPassword(
  auth,
  'example@email.com',
  'example-password'
);
const user = userCredential.user;
```

#### Database Query Example
From:
```typescript
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .eq('creator_id', userId);
```

To:
```typescript
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const lessonsRef = collection(db, 'lessons');
const q = query(lessonsRef, where('creator_id', '==', userId));
const querySnapshot = await getDocs(q);
const lessons = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

#### Storage Example
From:
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file);
```

To:
```typescript
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storageRef = ref(storage, `avatars/${userId}/avatar.png`);
await uploadBytes(storageRef, file);
const downloadURL = await getDownloadURL(storageRef);
```

## Success Criteria
- All documentation accurately reflects our GCP infrastructure
- No references to Supabase remain in any documentation files
- All code examples are updated to use GCP services
- New documentation is created for GCP-specific features
- Obsolete Supabase-specific documentation is removed
- Documentation is reviewed and validated for accuracy

## Additional Notes
- This is a high-priority task as incorrect documentation can lead to developer confusion and errors
- Documentation should be updated in batches to ensure consistency
- Consider creating a migration guide to help developers transition from Supabase to GCP
- Update the documentation index to reflect new and removed files
- Consider adding a section on GCP cost management and optimization

## Assignees
- Documentation Team
- DevOps Team (for technical validation)
- Development Team (for code example validation)

## Related Issues
- #123 Migrate to Google Cloud Platform
- #124 Update Environment Variables for GCP
- #125 Create Firebase Authentication Implementation

## Timeline
- Start Date: 2025-02-27
- Target Completion: 2025-03-07 (8 working days)

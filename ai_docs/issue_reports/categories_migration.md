**Description**
Currently, lesson request categories are hardcoded in `lesson-request.ts`. We need to move these to be dynamically loaded from Supabase's `categories` table to allow for better maintainability and admin control over categories.

**Current Implementation**
Categories are hardcoded as:
```typescript
export const LESSON_CATEGORIES = [
  'Trick Tutorial',
  'Beginner Basics',
  'Advanced Techniques',
  'Combo Tutorial',
  'Theory & Concepts',
  'Style Development',
  'Competition Prep',
  'Other'
] as const
```

**Proposed Changes**
1. Create new categories table in Supabase (if not exists)
2. Update schema types to use dynamic categories
3. Add API endpoint to fetch categories
4. Update UI components to use dynamic categories
5. Migrate existing data

**Technical Details**
- Table Schema:
```sql
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

**Testing Requirements**
- Unit tests for category fetching
- Integration tests for UI components
- Migration script testing
- Error handling verification

**Additional Context**
This change will enable admins to manage categories through the dashboard and make the system more flexible for future category additions/removals.

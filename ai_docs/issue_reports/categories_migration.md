**Description**
Currently, lesson request categories are hardcoded in `lesson-request.ts`. We need to move these to be dynamically loaded from Supabase's `categories` table to allow for better maintainability and admin control over categories.

**Current Implementation**
The categories are currently hardcoded in `lesson-request.ts` and used throughout the application. The Supabase database already has a `categories` table with the required schema, but it's not being utilized.

**Required Changes**

1. **New API Endpoint** (`app/api/categories/route.ts`):
   - GET endpoint to fetch all categories
   - Protected POST/DELETE endpoints for admin category management
   - Error handling and type safety

2. **Schema Updates** (`app/lib/schemas/lesson-request.ts`):
   - Remove hardcoded LESSON_CATEGORIES
   - Update zod schema to validate against dynamic categories
   - Add types for category data structure

3. **UI Components**:
   - Update RequestDialog to fetch and use dynamic categories
   - Add loading states and error handling
   - Maintain type safety with database types

4. **Data Migration**:
   - Script to populate initial categories from current hardcoded list
   - Verify existing lesson requests maintain category references

**Implementation Steps**

1. **API Layer**:
```typescript
// app/api/categories/route.ts
export async function GET() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  // Return categories with proper error handling
}
```

2. **React Hook**:
```typescript
// app/hooks/useCategories.ts
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  // Fetch and cache categories
}
```

3. **Migration Script**:
```sql
-- Initial category data
INSERT INTO categories (name) VALUES
  ('Trick Tutorial'),
  ('Beginner Basics'),
  ('Advanced Techniques'),
  ('Combo Tutorial'),
  ('Theory & Concepts'),
  ('Style Development'),
  ('Competition Prep'),
  ('Other');
```

**Files to Update**

1. `app/requests/components/request-dialog.tsx`:
   - Replace LESSON_CATEGORIES with dynamic data
   - Add loading state to Select component
   - Handle potential fetch errors

2. `app/requests/components/request-sidebar.tsx`:
   - Update category filtering to use dynamic categories
   - Add loading state for category list

3. `app/api/requests/route.ts`:
   - Update category validation to check against database
   - Maintain backward compatibility during migration

4. `app/lib/schemas/lesson-request.ts`:
   - Remove static category list
   - Update schema validation

**Testing Requirements**

1. **Unit Tests**:
   - Category fetching hook
   - API endpoint responses
   - Schema validation with dynamic categories

2. **Integration Tests**:
   - Request creation flow
   - Category filtering
   - Error handling

3. **Migration Testing**:
   - Verify existing requests maintain categories
   - Test backward compatibility
   - Validate admin operations

**Additional Context**
This change leverages our existing Supabase categories table and maintains type safety throughout the implementation. It will enable future admin controls for category management while ensuring existing lesson requests remain valid.

**Success Criteria**
- All categories load dynamically from database
- Existing lesson requests maintain their categories
- Type safety is maintained throughout
- Loading states and error handling work correctly
- Admin can manage categories (future enhancement)

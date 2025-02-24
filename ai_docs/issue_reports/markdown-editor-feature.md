# Feature: Add Markdown Editor for Lesson Content

## Overview
Add a rich markdown editor component to the lesson creation form to allow instructors to create detailed text content alongside their video lessons. This content will be stored in the lessons table's "content" column in Supabase.

## Technical Details

### Affected Files
- `app/components/ui/lesson-form.tsx` - Add markdown editor component
- `app/lib/schemas/lesson.ts` - Update lesson schema to include content field
- `app/components/ui/markdown-editor.tsx` - Create new markdown editor component
- Database migration needed for "content" column

### Implementation Requirements

1. **Markdown Editor Component**
   - Use `@mdx-js/react` for markdown processing
   - Include preview mode
   - Support common markdown features:
     - Headers (H1-H6)
     - Lists (ordered/unordered)
     - Code blocks with syntax highlighting
     - Tables
     - Images
     - Links
     - Blockquotes

2. **Form Integration**
   - Add content field to lesson form schema:
   ```typescript
   const lessonFormSchema = z.object({
     // ... existing fields
     content: z.string()
       .min(1, "Content is required")
       .max(50000, "Content must be less than 50000 characters"),
   });
   ```

3. **Database Changes**
   - Add "content" column to lessons table:
   ```sql
   ALTER TABLE lessons
   ADD COLUMN content TEXT;
   ```

4. **UI/UX Requirements**
   - Split-screen preview mode
   - Toolbar for common markdown formatting
   - Drag-and-drop image upload
   - Keyboard shortcuts
   - Responsive design
   - Accessibility compliance

### Testing Requirements
- Unit tests for markdown editor component
- Integration tests for form submission with content
- Validation tests for content length and formatting
- Accessibility tests (ARIA compliance)

## Acceptance Criteria

1. Users can write and edit markdown content while creating/editing lessons
2. Content is properly saved to Supabase
3. Preview mode accurately reflects final rendering
4. Content supports all required markdown features
5. Editor is fully responsive and accessible
6. Form validation handles content field appropriately
7. Image uploads work correctly within markdown
8. Content is properly sanitized before storage

## Implementation Steps

1. Create new markdown editor component
2. Update lesson form schema and UI
3. Add database migration
4. Implement content validation
5. Add preview functionality
6. Implement image upload handling
7. Add tests
8. Update documentation

## Additional Context

This feature will significantly enhance the learning experience by allowing instructors to provide detailed written content alongside their video lessons. The markdown format ensures content is structured and maintainable while being lightweight on storage.

## Labels
- enhancement
- feature
- ui
- database

## Estimated Complexity
Medium - Requires new component development, database changes, and careful consideration of content validation and security.

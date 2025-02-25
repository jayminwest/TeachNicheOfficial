# Style Guide

## Code Formatting

### TypeScript/JavaScript
```typescript
// Right way
function calculateTotal(items: Item[]): number {
  return items.reduce((total, item) => {
    return total + item.price;
  }, 0);
}

// Wrong way
function calculateTotal( items:Item[] ){
  return items.reduce((total,item)=>{return total+item.price},0)
}
```

### React Components
```typescript
// Right way
export function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="user-profile">
      {/* Component content */}
    </div>
  );
}

// Wrong way
export function UserProfile(props) {
  var editing = false
  return (<div className='user-profile'>{/* Content */}</div>)
}
```

## Naming Conventions

### Components
```typescript
// Right
export function UserProfile() {}
export function AuthenticationModal() {}

// Wrong
export function userProfile() {}
export function auth_modal() {}
```

### Variables
```typescript
// Right
const userCount = 0;
const isLoading = false;
const MAX_RETRIES = 3;

// Wrong
const UsErCoUnT = 0;
const loading = false;
const maxRetries = 3;
```

### Functions
```typescript
// Right
function handleSubmit() {}
function validateEmail() {}

// Wrong
function submit() {}
function emailvalidator() {}
```

## File Organization

### Directory Structure
```
src/
├── components/
│   ├── common/
│   └── features/
├── hooks/
├── utils/
└── types/
```

### Import Order
```typescript
// 1. React and external libraries
import { useState } from 'react';
import { z } from 'zod';

// 2. Internal components
import { Button } from '@/components/ui';

// 3. Types and utilities
import type { User } from '@/types';
import { formatDate } from '@/utils';

// 4. Styles
import './styles.css';
```

## CSS/Tailwind

### Class Organization
```html
<!-- Right -->
<div
  className={cn(
    "flex items-center",
    "p-4 rounded-lg",
    "bg-white dark:bg-gray-800",
    className
  )}
>

<!-- Wrong -->
<div className="flex items-center p-4 rounded-lg bg-white dark:bg-gray-800">
```

### Custom Classes
```css
/* Right */
.user-profile {
  @apply flex items-center gap-4 p-4;
}

/* Wrong */
.UserProfile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}
```

## Comments

### Component Documentation
```typescript
/**
 * UserProfile displays user information and handles profile updates
 *
 * @param user - The user object containing profile data
 * @param onUpdate - Callback function when profile is updated
 */
export function UserProfile({ user, onUpdate }: UserProfileProps) {
  // Implementation
}
```

### Code Comments
```typescript
// Right
// Calculate total with tax and shipping
const total = subtotal * TAX_RATE + SHIPPING_COST;

// Wrong
// Calculate
const t = s * 1.2 + 10;
```

## Error Handling

### Error Messages
```typescript
// Right
throw new Error('Failed to load user profile: Invalid ID');

// Wrong
throw new Error('error!!!');
```

### Try/Catch Blocks
```typescript
// Right
try {
  await saveUserData(userData);
} catch (error) {
  logger.error('Failed to save user data:', error);
  throw new Error('Unable to save user data');
}

// Wrong
try {
  await saveUserData(userData);
} catch (e) {
  console.log(e);
}
```

## Testing

### Test Organization
```typescript
// Right
describe('UserProfile', () => {
  it('displays user information correctly', () => {
    // Test implementation
  });
});

// Wrong
test('it works', () => {
  // Test implementation
});
```

## Version Control

### Commit Messages
```
// Right
feat(auth): implement OAuth login with Google

// Wrong
fixed stuff
```

## Documentation

### README
- Clear project description
- Setup instructions
- Usage examples
- Contributing guidelines
- License information

### Component Props
```typescript
interface ButtonProps {
  /** The button's label text */
  label: string;
  /** Called when the button is clicked */
  onClick: () => void;
  /** Optional CSS class names */
  className?: string;
}
```

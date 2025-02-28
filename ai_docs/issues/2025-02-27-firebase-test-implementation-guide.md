# Firebase Test Implementation Guide

This document provides detailed guidance for implementing Firebase mocks in our test suite, following the migration from Supabase to Firebase.

## Mock Structure

### Firebase Authentication Mocks

The authentication mocks simulate a logged-in user with the following properties:

```javascript
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  getIdToken: jest.fn().mockResolvedValue('mock-id-token')
};
```

Key authentication functions that are mocked:
- `signInWithEmailAndPassword`
- `createUserWithEmailAndPassword`
- `signOut`
- `onAuthStateChanged`

### Firebase Firestore Mocks

The Firestore mocks provide simulated database operations:

- `getDoc`: Returns a document with test data
- `getDocs`: Returns a collection with test documents
- `setDoc`: Simulates document creation/update
- `addDoc`: Simulates adding a document with auto-generated ID
- `updateDoc`: Simulates document updates
- `deleteDoc`: Simulates document deletion
- `query`, `where`, `orderBy`, `limit`: Query builder functions

### Firebase Storage Mocks

The Storage mocks simulate file operations:

- `uploadBytes`: Simulates file upload
- `getDownloadURL`: Returns a test URL
- `deleteObject`: Simulates file deletion

## Usage in Tests

### Authentication Testing

To test components that require authentication:

```javascript
import { render, screen } from '@testing-library/react';
import { getAuth } from 'firebase/auth';
import YourComponent from './YourComponent';

test('renders authenticated component', () => {
  // The mock will automatically provide a logged-in user
  render(<YourComponent />);
  
  // Your assertions here
});
```

To test sign-in functionality:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import SignInComponent from './SignInComponent';

test('handles sign in', async () => {
  render(<SignInComponent />);
  
  // Interact with the component
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' }
  });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  // Verify the mock was called
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
    expect.anything(),
    'test@example.com',
    'password123'
  );
});
```

### Firestore Testing

To test components that read from Firestore:

```javascript
import { render, screen } from '@testing-library/react';
import { getDoc, doc } from 'firebase/firestore';
import YourComponent from './YourComponent';

test('displays data from firestore', async () => {
  // Set up specific mock return value if needed
  getDoc.mockResolvedValueOnce({
    exists: () => true,
    data: () => ({ name: 'Custom Test Name' })
  });
  
  render(<YourComponent />);
  
  // Assert that data is displayed
  expect(await screen.findByText('Custom Test Name')).toBeInTheDocument();
});
```

### Storage Testing

To test components that use Firebase Storage:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { uploadBytes, ref, getDownloadURL } from 'firebase/storage';
import FileUploadComponent from './FileUploadComponent';

test('handles file upload', async () => {
  render(<FileUploadComponent />);
  
  // Simulate file upload
  const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText(/upload/i), {
    target: { files: [file] }
  });
  
  // Verify upload was called
  expect(uploadBytes).toHaveBeenCalled();
  
  // Verify download URL is used
  expect(await screen.findByText('https://test-storage-url.com/test-file.jpg')).toBeInTheDocument();
});
```

## Customizing Mock Responses

For tests that need specific responses, you can override the default mocks:

```javascript
import { getDoc } from 'firebase/firestore';

// Before your test
getDoc.mockResolvedValueOnce({
  exists: () => true,
  data: () => ({ 
    id: 'custom-id',
    name: 'Custom Name',
    price: 99.99
  })
});
```

## Testing Error Scenarios

To test error handling:

```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';

// Before your test
signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Auth failed'));

// Then test your error handling
```

## Best Practices

1. Reset mocks between tests using `beforeEach(() => { jest.clearAllMocks() })`
2. Use `mockResolvedValueOnce` for one-time custom responses
3. Check that functions were called with the expected parameters
4. Test both success and error scenarios
5. For complex components, consider using a custom test provider that wraps Firebase context providers

This guide should help ensure consistent testing practices across the application as we complete the migration from Supabase to Firebase.

# Firebase Test Templates

This document provides templates for rewriting Supabase tests to use Firebase.

## Authentication Test Template

### Original Supabase Version:
```typescript
import { render, screen } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import AuthComponent from '../AuthComponent';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signIn: jest.fn().mockResolvedValue({ user: { id: 'test-user-id' } }),
      signUp: jest.fn().mockResolvedValue({ user: { id: 'new-user-id' } }),
      signOut: jest.fn().mockResolvedValue({}),
      user: { id: 'test-user-id' }
    }
  }))
}));

test('renders authenticated content', () => {
  render(<AuthComponent />);
  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});
```

### Firebase Version:
```typescript
import { render, screen } from '@testing-library/react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import AuthComponent from '../AuthComponent';

// Firebase mocks are already set up in jest.setup.js
// No need to mock them here unless you need specific behavior

test('renders authenticated content', () => {
  // The mock in jest.setup.js already provides a logged-in user
  render(<AuthComponent />);
  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});
```

## Database Query Test Template

### Original Supabase Version:
```typescript
import { render, screen } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import DataComponent from '../DataComponent';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-id', name: 'Test Item' },
        error: null
      })
    })
  }))
}));

test('displays data from database', async () => {
  render(<DataComponent id="test-id" />);
  expect(await screen.findByText('Test Item')).toBeInTheDocument();
});
```

### Firebase Version:
```typescript
import { render, screen } from '@testing-library/react';
import { getDoc, doc } from 'firebase/firestore';
import DataComponent from '../DataComponent';

// Override the default mock for this specific test if needed
beforeEach(() => {
  (getDoc as jest.Mock).mockResolvedValue({
    exists: () => true,
    data: () => ({ id: 'test-id', name: 'Test Item' })
  });
});

test('displays data from database', async () => {
  render(<DataComponent id="test-id" />);
  expect(await screen.findByText('Test Item')).toBeInTheDocument();
  
  // Verify Firestore was called correctly
  expect(doc).toHaveBeenCalledWith(expect.anything(), 'items', 'test-id');
  expect(getDoc).toHaveBeenCalled();
});
```

## Storage Test Template

### Original Supabase Version:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import StorageComponent from '../StorageComponent';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-file.jpg' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ publicURL: 'https://test-url.com/test-file.jpg' })
      })
    }
  }))
}));

test('uploads file to storage', async () => {
  render(<StorageComponent />);
  
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const input = screen.getByLabelText(/upload/i);
  
  fireEvent.change(input, { target: { files: [file] } });
  
  expect(await screen.findByText(/uploaded/i)).toBeInTheDocument();
  expect(await screen.findByText('https://test-url.com/test-file.jpg')).toBeInTheDocument();
});
```

### Firebase Version:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import StorageComponent from '../StorageComponent';

test('uploads file to storage', async () => {
  render(<StorageComponent />);
  
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const input = screen.getByLabelText(/upload/i);
  
  fireEvent.change(input, { target: { files: [file] } });
  
  // Verify Firebase Storage was called correctly
  expect(ref).toHaveBeenCalled();
  expect(uploadBytes).toHaveBeenCalled();
  expect(getDownloadURL).toHaveBeenCalled();
  
  expect(await screen.findByText(/uploaded/i)).toBeInTheDocument();
  expect(await screen.findByText('https://test-storage-url.com/test-file.jpg')).toBeInTheDocument();
});
```

## Authentication Flow Test Template

### Original Supabase Version:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import SignInForm from '../SignInForm';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signIn: jest.fn().mockImplementation((email, password) => {
        if (email === 'test@example.com' && password === 'password123') {
          return Promise.resolve({ user: { id: 'test-user-id' }, error: null });
        }
        return Promise.resolve({ user: null, error: { message: 'Invalid credentials' } });
      })
    }
  }))
}));

test('handles successful sign in', async () => {
  render(<SignInForm />);
  
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});

test('handles sign in error', async () => {
  render(<SignInForm />);
  
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
```

### Firebase Version:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import SignInForm from '../SignInForm';

test('handles successful sign in', async () => {
  // Default mock in jest.setup.js returns successful sign-in
  render(<SignInForm />);
  
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
  
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
    expect.anything(),
    'test@example.com',
    'password123'
  );
});

test('handles sign in error', async () => {
  // Override the default mock for this specific test
  (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(
    new Error('Firebase: Error (auth/invalid-credential).')
  );
  
  render(<SignInForm />);
  
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/invalid credential/i)).toBeInTheDocument();
  });
});
```

## Rewriting Process Checklist

For each test file:

1. [ ] Identify Supabase functionality being used (auth, database, storage)
2. [ ] Remove Supabase imports and mocks
3. [ ] Import appropriate Firebase modules
4. [ ] Update test assertions to match Firebase behavior
5. [ ] Verify Firebase mock functions are being called correctly
6. [ ] Test both success and error scenarios
7. [ ] Run the test to verify it passes

## Common Patterns

### Supabase to Firebase Mapping

| Supabase | Firebase |
|----------|----------|
| `supabase.auth.signIn()` | `signInWithEmailAndPassword()` |
| `supabase.auth.signUp()` | `createUserWithEmailAndPassword()` |
| `supabase.auth.signOut()` | `signOut()` |
| `supabase.auth.user()` | `getAuth().currentUser` |
| `supabase.from('table').select()` | `getDocs(collection(db, 'table'))` |
| `supabase.from('table').insert()` | `addDoc(collection(db, 'table'), data)` |
| `supabase.from('table').update()` | `updateDoc(doc(db, 'table', id), data)` |
| `supabase.from('table').delete()` | `deleteDoc(doc(db, 'table', id))` |
| `supabase.storage.from('bucket').upload()` | `uploadBytes(ref(storage, path), file)` |
| `supabase.storage.from('bucket').getPublicUrl()` | `getDownloadURL(ref(storage, path))` |

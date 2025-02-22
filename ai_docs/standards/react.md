# React Development Standards

## Component Architecture

### Functional Components
```typescript
// Preferred
export function UserProfile({ user }: UserProfileProps) {
  return <div>{user.name}</div>;
}

// Avoid
class UserProfile extends React.Component {
  render() {
    return <div>{this.props.user.name}</div>;
  }
}
```

### Props Interface
```typescript
interface UserProfileProps {
  // Required props first
  user: User;
  onUpdate: (user: User) => void;
  
  // Optional props after
  className?: string;
  children?: React.ReactNode;
}
```

## Hooks Usage

### State Management
```typescript
// Local state
const [isOpen, setIsOpen] = useState(false);

// Complex state
const [state, dispatch] = useReducer(reducer, initialState);

// Derived state
const isValid = useMemo(() => {
  return validateData(data);
}, [data]);
```

### Side Effects
```typescript
// Data fetching
useEffect(() => {
  async function fetchData() {
    const data = await api.getData();
    setData(data);
  }
  fetchData();
}, []);

// Cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### Custom Hooks
```typescript
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}
```

## Performance Optimization

### Memoization
```typescript
// Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => b.price - a.price);
}, [items]);

// Memoize callbacks
const handleSubmit = useCallback(() => {
  // Handle submission
}, [dependencies]);

// Memoize components
const MemoizedComponent = memo(Component);
```

### Code Splitting
```typescript
// Lazy loading
const UserProfile = lazy(() => import('./UserProfile'));

// Suspense boundary
<Suspense fallback={<Loading />}>
  <UserProfile />
</Suspense>
```

## Error Handling

### Error Boundaries
```typescript
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

### Async Error Handling
```typescript
async function handleSubmit() {
  try {
    await submitData();
  } catch (error) {
    if (error instanceof ValidationError) {
      setFieldErrors(error.fields);
    } else {
      setGlobalError(error.message);
    }
  }
}
```

## Testing

### Component Testing
```typescript
describe('UserProfile', () => {
  it('renders user information', () => {
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });

  it('handles updates', async () => {
    const onUpdate = jest.fn();
    render(<UserProfile user={mockUser} onUpdate={onUpdate} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(onUpdate).toHaveBeenCalled();
  });
});
```

## Accessibility

### ARIA Attributes
```typescript
function Dialog({ isOpen, onClose, title, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <h2 id="dialog-title">{title}</h2>
      <div id="dialog-description">{children}</div>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### Keyboard Navigation
```typescript
function NavigationMenu() {
  const [activeIndex, setActiveIndex] = useState(0);

  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
        setActiveIndex(i => (i + 1) % items.length);
        break;
      case 'ArrowLeft':
        setActiveIndex(i => (i - 1 + items.length) % items.length);
        break;
    }
  }

  return (
    <nav role="navigation" onKeyDown={handleKeyDown}>
      {/* Navigation items */}
    </nav>
  );
}
```

## State Management

### Context Usage
```typescript
// Context definition
const UserContext = createContext<UserContextType | null>(null);

// Provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const value = useMemo(() => ({
    user,
    setUser
  }), [user]);
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

## Forms

### Form Handling
```typescript
function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data);
    } catch (error) {
      form.setError('root', { message: error.message });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

## Documentation

### Component Documentation
```typescript
/**
 * UserProfile displays and manages user information
 *
 * @example
 * ```tsx
 * <UserProfile
 *   user={currentUser}
 *   onUpdate={handleUpdate}
 * />
 * ```
 */
export function UserProfile({ user, onUpdate }: UserProfileProps) {
  // Implementation
}
```

## Security

### Data Sanitization
```typescript
function Comment({ content }: { content: string }) {
  // Sanitize content before rendering
  const sanitizedContent = DOMPurify.sanitize(content);
  
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}
```

## Performance Monitoring

### Metrics Collection
```typescript
function MetricsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Report Web Vitals
    reportWebVitals(metric => {
      analytics.track(metric.name, metric);
    });
  }, []);

  return children;
}
```

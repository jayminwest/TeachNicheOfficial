'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      padding: '1rem', 
      textAlign: 'center' 
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Something went wrong
      </h1>
      <p style={{ marginBottom: '2rem' }}>
        Sorry, a critical error has occurred.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={reset}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Try again
        </button>
        <a 
          href="/" 
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#f5f5f5', 
            color: '#333', 
            borderRadius: '0.375rem',
            textDecoration: 'none'
          }}
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}

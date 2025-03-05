export default function Custom500() {
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
        500 - Server Error
      </h1>
      <p style={{ marginBottom: '2rem' }}>
        Sorry, something went wrong on our server.
      </p>
      <a 
        href="/" 
        style={{ 
          padding: '0.5rem 1rem', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          borderRadius: '0.375rem',
          textDecoration: 'none'
        }}
      >
        Return to Home
      </a>
    </div>
  );
}

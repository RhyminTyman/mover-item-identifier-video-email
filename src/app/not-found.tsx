export default function NotFound() {
  return (
    <div style={{
      margin: 0,
      padding: 0,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
        padding: '2rem'
      }}>
        <h1 style={{
          fontSize: '4rem',
          margin: '0 0 1rem 0',
          color: '#333'
        }}>404</h1>
        <h2 style={{
          fontSize: '1.5rem',
          margin: '0 0 1rem 0',
          color: '#666'
        }}>Page Not Found</h2>
        <p style={{
          fontSize: '1rem',
          color: '#888',
          marginBottom: '2rem'
        }}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <p style={{
          fontSize: '1rem',
          color: '#888'
        }}>Please check the URL and try again.</p>
      </div>
    </div>
  );
}

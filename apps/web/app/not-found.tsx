import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: '#0a0a0a',
      color: '#ffffff'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404 - Page Not Found</h1>
      <p style={{ marginBottom: '2rem', color: '#d1d1d1' }}>
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#60a5fa',
          color: 'white',
          borderRadius: '0.375rem',
          textDecoration: 'none'
        }}
      >
        Go Home
      </Link>
    </div>
  );
}

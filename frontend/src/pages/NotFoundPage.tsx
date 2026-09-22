import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <Sprout size={48} style={{ color: '#4ade80' }} />
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>Page Not Found</h1>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
        The page you are looking for does not exist or has not been built yet.
      </p>
      <Link to="/" className="btn btn-primary" id="not-found-home-btn">
        Return Home
      </Link>
    </div>
  );
};

export default NotFoundPage;

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const from = (location.state as any)?.from?.pathname || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!email.trim() || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });

      // Redirect to target path or role dashboard
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'FARMER') {
        navigate('/farmer/dashboard');
      } else if (user.role === 'DEALER') {
        navigate('/dealer/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badge}>
            <ShieldCheck size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
            MavunoTrust Secure Access
          </div>
          <h1 style={styles.title}>Sign in to your account</h1>
          <p style={styles.subtitle}>
            Empowering farmers & verified dealers with transparent agricultural trade.
          </p>
        </div>

        {(error || validationError) && (
          <div style={styles.errorAlert}>
            <AlertTriangle size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', flexShrink: 0 }} />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="farmer@mavunotrust.co.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={styles.label} htmlFor="password">
                Password
              </label>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, width: '100%', paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitButton,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={styles.footer}>
          <p>
            Don't have an account?{' '}
            <Link to="/register" style={styles.link}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};


const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '80vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '36px 32px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)',
  },
  header: {
    marginBottom: '28px',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#4ade80',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#f8fafc',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0,
    lineHeight: 1.5,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  input: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '0.95rem',
    color: '#f8fafc',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.2s',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '8px',
    transition: 'background-color 0.2s',
  },
  footer: {
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid #334155',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#94a3b8',
  },
  link: {
    color: '#4ade80',
    fontWeight: 600,
    textDecoration: 'none',
  },
};

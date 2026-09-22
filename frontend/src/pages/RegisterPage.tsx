import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();

  const [role, setRole] = useState<'FARMER' | 'DEALER'>('FARMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!fullName.trim() || !email.trim() || !password) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (!isPasswordValid) {
      setValidationError('Password does not meet complexity requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        password,
        role,
      });

      if (user.role === 'FARMER') {
        navigate('/farmer/dashboard');
      } else {
        navigate('/dealer/dashboard');
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
          <div style={styles.badge}>🌱 Join MavunoTrust Network</div>
          <h1 style={styles.title}>Create Your Account</h1>
          <p style={styles.subtitle}>
            Connect directly with verified agricultural partners across Kenya.
          </p>
        </div>

        {(error || validationError) && (
          <div style={styles.errorAlert}>
            ⚠️ {validationError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Role selector */}
          <div style={styles.field}>
            <label style={styles.label}>Select Account Type</label>
            <div style={styles.roleGrid}>
              <div
                onClick={() => setRole('FARMER')}
                style={{
                  ...styles.roleCard,
                  borderColor: role === 'FARMER' ? '#16a34a' : '#334155',
                  backgroundColor: role === 'FARMER' ? 'rgba(22, 163, 74, 0.1)' : '#0f172a',
                }}
              >
                <div style={styles.roleIcon}>🧑‍🌾</div>
                <div style={styles.roleTitle}>Farmer</div>
                <div style={styles.roleDesc}>Post crop listings & calculate cost/profit</div>
              </div>

              <div
                onClick={() => setRole('DEALER')}
                style={{
                  ...styles.roleCard,
                  borderColor: role === 'DEALER' ? '#2563eb' : '#334155',
                  backgroundColor: role === 'DEALER' ? 'rgba(37, 99, 235, 0.1)' : '#0f172a',
                }}
              >
                <div style={styles.roleIcon}>💼</div>
                <div style={styles.roleTitle}>Dealer / Broker</div>
                <div style={styles.roleDesc}>Find farmers & complete AFA verification</div>
              </div>
            </div>
            {role === 'DEALER' && (
              <p style={styles.dealerNotice}>
                ℹ️ Dealer profiles require AFA licence verification before making official trade offers.
              </p>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="fullName">
              Full Name / Business Name *
            </label>
            <input
              id="fullName"
              type="text"
              required
              placeholder="e.g. Wanjiku Agricultural Enterprise"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="wanjiku@mavunotrust.co.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="phone">
              Phone Number (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+254 700 000 000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">
              Password *
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            {/* Password strength indicators */}
            <div style={styles.pwdRules}>
              <span style={{ color: hasMinLength ? '#4ade80' : '#94a3b8' }}>
                {hasMinLength ? '✓' : '•'} At least 8 characters
              </span>
              <span style={{ color: hasUpper ? '#4ade80' : '#94a3b8' }}>
                {hasUpper ? '✓' : '•'} 1 uppercase letter
              </span>
              <span style={{ color: hasNumber ? '#4ade80' : '#94a3b8' }}>
                {hasNumber ? '✓' : '•'} 1 number
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitButton,
              backgroundColor: role === 'FARMER' ? '#16a34a' : '#2563eb',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting
              ? 'Creating account...'
              : `Register as ${role === 'FARMER' ? 'Farmer' : 'Dealer'} →`}
          </button>
        </form>

        <div style={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '85vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '32px 16px',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
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
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '6px',
  },
  roleCard: {
    border: '2px solid #334155',
    borderRadius: '12px',
    padding: '16px 12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  roleIcon: {
    fontSize: '1.75rem',
    marginBottom: '6px',
  },
  roleTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#f8fafc',
    marginBottom: '4px',
  },
  roleDesc: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    lineHeight: 1.3,
  },
  dealerNotice: {
    fontSize: '0.8rem',
    color: '#60a5fa',
    margin: '8px 0 0 0',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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
  },
  pwdRules: {
    display: 'flex',
    gap: '12px',
    fontSize: '0.75rem',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  submitButton: {
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '8px',
    transition: 'all 0.2s',
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

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, ShieldCheck, AlertTriangle, ArrowRight, Sprout } from 'lucide-react';
import '../styles/AuthPages.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const from = (location.state as Record<string, any>)?.from?.pathname || null;

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

  const displayError = validationError || error;

  return (
    <div className="auth-card">
      {/* Brand link — back to homepage */}
      <Link to="/" className="auth-brand" aria-label="MavunoTrust home">
        <span className="auth-brand-icon" aria-hidden="true"><Sprout size={18} /></span>
        <span className="auth-brand-name">MavunoTrust</span>
      </Link>

      {/* Header */}
      <div className="auth-header">
        <div className="auth-badge">
          <ShieldCheck size={13} />
          <span>Secure Access</span>
        </div>
        <h1 className="auth-title">Sign in to your account</h1>
        <p className="auth-subtitle">
          Empowering farmers &amp; verified dealers with transparent agricultural trade.
        </p>
      </div>

      {/* Error */}
      {displayError && (
        <div className="auth-error" role="alert">
          <AlertTriangle size={15} />
          <span>{displayError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            required
            placeholder="farmer@mavunotrust.co.ke"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="login-password">Password</label>
          <div className="auth-input-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input auth-input--padded"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button
          id="login-submit"
          type="submit"
          disabled={isSubmitting}
          className="auth-submit"
        >
          {isSubmitting
            ? <><span className="auth-spinner" aria-hidden="true" /> Signing in…</>
            : <><span>Sign In</span><ArrowRight size={17} /></>
          }
        </button>
      </form>

      <p className="auth-footer-text">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="auth-link">Create an account</Link>
      </p>
    </div>
  );
};

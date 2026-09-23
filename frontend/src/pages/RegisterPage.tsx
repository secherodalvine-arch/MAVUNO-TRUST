import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Eye, EyeOff, Sprout, Briefcase,
  AlertTriangle, Info, CheckCircle2, Circle, ArrowRight,
} from 'lucide-react';
import '../styles/AuthPages.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();

  const [role, setRole] = useState<'FARMER' | 'DEALER'>('FARMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

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
      if (user.role === 'FARMER') navigate('/farmer/dashboard');
      else navigate('/dealer/dashboard');
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="auth-card auth-card--wide">
      {/* Brand */}
      <Link to="/" className="auth-brand" aria-label="MavunoTrust home">
        <span className="auth-brand-icon" aria-hidden="true"><Sprout size={18} /></span>
        <span className="auth-brand-name">MavunoTrust</span>
      </Link>

      {/* Header */}
      <div className="auth-header">
        <div className="auth-badge">
          <Sprout size={13} />
          <span>Join the Network</span>
        </div>
        <h1 className="auth-title">Create Your Account</h1>
        <p className="auth-subtitle">
          Connect directly with verified agricultural partners across Kenya.
        </p>
      </div>

      {/* Error */}
      {displayError && (
        <div className="auth-error" role="alert">
          <AlertTriangle size={15} />
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Role selector */}
        <div className="auth-field">
          <label className="auth-label">Account Type</label>
          <div className="auth-role-grid">
            <button
              type="button"
              onClick={() => setRole('FARMER')}
              className={`auth-role-btn ${role === 'FARMER' ? 'auth-role-btn--active' : ''}`}
              aria-pressed={role === 'FARMER'}
            >
              <Sprout size={26} />
              <span className="auth-role-title">Farmer</span>
              <span className="auth-role-desc">Post crop listings &amp; calculate cost/profit</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('DEALER')}
              className={`auth-role-btn auth-role-btn--dealer ${role === 'DEALER' ? 'auth-role-btn--dealer-active' : ''}`}
              aria-pressed={role === 'DEALER'}
            >
              <Briefcase size={26} />
              <span className="auth-role-title">Dealer / Broker</span>
              <span className="auth-role-desc">Find farmers &amp; complete AFA verification</span>
            </button>
          </div>

          {role === 'DEALER' && (
            <p className="auth-notice">
              <Info size={13} />
              Dealer profiles require AFA licence verification before making official trade offers.
            </p>
          )}
        </div>

        {/* Full Name */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-name">
            Full Name / Business Name <span className="auth-required">*</span>
          </label>
          <input
            id="reg-name"
            type="text"
            required
            placeholder="e.g. Wanjiku Agricultural Enterprise"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="auth-input"
            autoComplete="name"
          />
        </div>

        {/* Email */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-email">
            Email Address <span className="auth-required">*</span>
          </label>
          <input
            id="reg-email"
            type="email"
            required
            placeholder="wanjiku@mavunotrust.co.ke"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            autoComplete="email"
          />
        </div>

        {/* Phone */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-phone">
            Phone Number <span className="auth-optional">(Optional)</span>
          </label>
          <input
            id="reg-phone"
            type="tel"
            placeholder="+254 700 000 000"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="auth-input"
            autoComplete="tel"
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-password">
            Password <span className="auth-required">*</span>
          </label>
          <div className="auth-input-wrap">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input auth-input--padded"
              autoComplete="new-password"
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

          {/* Password strength */}
          <div className="auth-pwd-rules">
            <span className={hasMinLength ? 'pwd-rule pwd-rule--pass' : 'pwd-rule'}>
              {hasMinLength ? <CheckCircle2 size={12} /> : <Circle size={12} />}
              8+ characters
            </span>
            <span className={hasUpper ? 'pwd-rule pwd-rule--pass' : 'pwd-rule'}>
              {hasUpper ? <CheckCircle2 size={12} /> : <Circle size={12} />}
              Uppercase
            </span>
            <span className={hasNumber ? 'pwd-rule pwd-rule--pass' : 'pwd-rule'}>
              {hasNumber ? <CheckCircle2 size={12} /> : <Circle size={12} />}
              Number
            </span>
          </div>
        </div>

        <button
          id="register-submit"
          type="submit"
          disabled={isSubmitting}
          className={`auth-submit ${role === 'DEALER' ? 'auth-submit--dealer' : ''}`}
        >
          {isSubmitting
            ? <><span className="auth-spinner" aria-hidden="true" /> Creating account…</>
            : <><span>Register as {role === 'FARMER' ? 'Farmer' : 'Dealer'}</span><ArrowRight size={17} /></>
          }
        </button>
      </form>

      <p className="auth-footer-text">
        Already have an account?{' '}
        <Link to="/login" className="auth-link">Sign in</Link>
      </p>
    </div>
  );
};

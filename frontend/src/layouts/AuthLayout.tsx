import { Outlet, Link } from 'react-router-dom';
import '../styles/AuthLayout.css';

/**
 * AuthLayout — full-screen layout for Login and Register pages.
 * No Navbar. No Footer. Just a centered auth card with a minimal brand strip at top.
 */
const AuthLayout = () => {
  return (
    <div className="auth-layout">
      {/* Decorative background */}
      <div className="auth-layout-bg" aria-hidden="true" />
      <div className="auth-layout-grid" aria-hidden="true" />

      {/* Minimal top bar */}
      <div className="auth-layout-topbar">
        <Link to="/" className="auth-layout-brand" aria-label="Back to MavunoTrust homepage">
          <img src="/logo.png" alt="MavunoTrust Logo" className="auth-layout-logo-img" />
          <span className="auth-layout-brand-name">MavunoTrust</span>
        </Link>
      </div>

      {/* Page content */}
      <main className="auth-layout-main">
        <Outlet />
      </main>

      {/* Minimal footer strip */}
      <p className="auth-layout-footer">
        &copy; {new Date().getFullYear()} MavunoTrust. Empowering Kenya's agricultural trade.
      </p>
    </div>
  );
};

export default AuthLayout;

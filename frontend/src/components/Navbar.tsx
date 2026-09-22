import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" aria-label="MavunoTrust Home">
          <span className="brand-icon">🌾</span>
          <span className="brand-name">MavunoTrust</span>
        </Link>

        <div style={navRightStyle}>
          {user ? (
            <div style={userControlStyle}>
              <Link
                to={
                  user.role === 'FARMER'
                    ? '/farmer/dashboard'
                    : user.role === 'DEALER'
                    ? '/dealer/dashboard'
                    : '/admin/dashboard'
                }
                style={dashboardLinkStyle}
              >
                Dashboard
              </Link>
              <Link to="/transactions" style={dashboardLinkStyle}>
                Transactions
              </Link>
              <Link to="/messages" style={dashboardLinkStyle}>
                Messages
              </Link>

              <span
                style={{
                  ...roleBadgeStyle,
                  backgroundColor:
                    user.role === 'FARMER'
                      ? 'rgba(34, 197, 94, 0.15)'
                      : user.role === 'DEALER'
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'rgba(234, 179, 8, 0.15)',
                  color:
                    user.role === 'FARMER'
                      ? '#4ade80'
                      : user.role === 'DEALER'
                      ? '#60a5fa'
                      : '#fde047',
                  borderColor:
                    user.role === 'FARMER'
                      ? 'rgba(34, 197, 94, 0.3)'
                      : user.role === 'DEALER'
                      ? 'rgba(59, 130, 246, 0.3)'
                      : 'rgba(234, 179, 8, 0.3)',
                }}
              >
                {user.role}
              </span>

              <span style={userNameStyle}>{user.fullName}</span>

              <button onClick={handleLogout} style={logoutBtnStyle}>
                Log Out
              </button>
            </div>
          ) : (
            <div style={authButtonsStyle}>
              <Link to="/login" style={loginBtnStyle}>
                Sign In
              </Link>
              <Link to="/register" style={registerBtnStyle}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const navRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const userControlStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const dashboardLinkStyle: React.CSSProperties = {
  color: '#cbd5e1',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 600,
};

const roleBadgeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '12px',
  border: '1px solid transparent',
};

const userNameStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontSize: '0.875rem',
  fontWeight: 500,
};

const logoutBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #475569',
  color: '#94a3b8',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const authButtonsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const loginBtnStyle: React.CSSProperties = {
  color: '#f8fafc',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 600,
  padding: '6px 14px',
};

const registerBtnStyle: React.CSSProperties = {
  backgroundColor: '#16a34a',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 600,
  padding: '6px 14px',
  borderRadius: '6px',
};

export default Navbar;

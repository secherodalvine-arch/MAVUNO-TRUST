import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <nav className="pub-nav" aria-label="Main navigation">
      <div className="pub-nav-inner">
        {/* Brand */}
        <Link to="/" className="pub-nav-brand" aria-label="MavunoTrust Home">
          <img src="/logo.png" alt="MavunoTrust Logo" className="pub-nav-logo-img" />
          <span className="pub-nav-name">MavunoTrust</span>
        </Link>

        {/* Desktop nav links */}
        <div className="pub-nav-links">
          <a href="/#features" className="pub-nav-link">
            Features
          </a>
          <Link
            to="/about"
            className={`pub-nav-link ${pathname === '/about' ? 'pub-nav-link--active' : ''}`}
          >
            About Us
          </Link>
        </div>

        {/* Desktop auth buttons */}
        <div className="pub-nav-actions">
          <Link
            to="/login"
            className={`pub-nav-link ${pathname === '/login' ? 'pub-nav-link--active' : ''}`}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="pub-nav-register"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="pub-nav-hamburger"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="pub-nav-mobile" role="menu">
          <a href="/#features" className="pub-nav-mobile-link" onClick={() => setMobileOpen(false)}>
            Features
          </a>
          <Link
            to="/about"
            className={`pub-nav-mobile-link ${pathname === '/about' ? 'pub-nav-link--active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            About Us
          </Link>
          <Link to="/login" className="pub-nav-mobile-link" onClick={() => setMobileOpen(false)}>
            Sign In
          </Link>
          <Link to="/register" className="pub-nav-mobile-link pub-nav-mobile-link--primary" onClick={() => setMobileOpen(false)}>
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

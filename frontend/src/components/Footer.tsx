import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="MavunoTrust Logo" className="footer-logo-img" />
          <span className="footer-brand-name">MavunoTrust</span>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/" className="footer-link">Home</Link>
          <a href="/#features" className="footer-link">Features</a>
          <Link to="/about" className="footer-link">About Us</Link>
          <Link to="/register" className="footer-link">Register</Link>
          <Link to="/login" className="footer-link">Sign In</Link>
        </nav>

        <span className="footer-copy">
          &copy; {year} MavunoTrust. Empowering Kenya's agricultural trade.
        </span>
      </div>
    </footer>
  );
};

export default Footer;

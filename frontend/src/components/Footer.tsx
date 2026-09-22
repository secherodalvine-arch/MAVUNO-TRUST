import { Sprout } from 'lucide-react';
import '../styles/Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Sprout size={16} style={{ color: '#4ade80' }} />
          MavunoTrust
        </span>
        <span className="footer-copy">© {year} MavunoTrust. Platform under active development.</span>
      </div>
    </footer>
  );
};

export default Footer;

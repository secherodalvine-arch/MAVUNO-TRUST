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
        <span className="footer-copy">
          &copy; {year} MavunoTrust. Empowering Kenya's agricultural trade.
        </span>
      </div>
    </footer>
  );
};

export default Footer;

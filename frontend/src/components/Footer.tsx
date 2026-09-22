import '../styles/Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">🌾 MavunoTrust</span>
        <span className="footer-copy">© {year} MavunoTrust. Platform under active development.</span>
      </div>
    </footer>
  );
};

export default Footer;

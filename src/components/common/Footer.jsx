import { Link } from 'react-router-dom';
import { appConfig } from '../../config';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-links">
        <Link to="/about">About Us</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms">Terms & Conditions</Link>
        <Link to="/refund-policy">Refund Policy</Link>
        <Link to="/pricing">Pricing</Link>
      </div>
      <div className="footer-meta">
        <span>Need help? <a href={`mailto:${appConfig.supportEmail}`}>{appConfig.supportEmail}</a></span>
        <span>Green Lynk © {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}

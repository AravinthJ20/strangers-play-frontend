import { Link } from 'react-router-dom';

const logoPath = '/assets/images/Strangers_Play_logo.png';

export default function AuthShell({ title, subtitle, footer, children }) {
  return (
    <div className="auth-shell">
      <section className="auth-brand-panel">
        <Link to="/" className="brand-mark auth-brand-mark">
          <img src={logoPath} alt="Strangers Play" className="brand-logo" />
          <div>
            <strong>Strangers Play</strong>
            <span>Chat that starts with consent and grows with community.</span>
          </div>
        </Link>
        <div className="auth-brand-copy">
          <div className="eyebrow">Production Identity</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <div className="auth-brand-list">
            <span>Connection-first conversations</span>
            <span>Groups, media, stickers, invites</span>
            <span>Designed for launch, not just development</span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-card">
          {children}
          {footer}
        </div>
      </section>
    </div>
  );
}

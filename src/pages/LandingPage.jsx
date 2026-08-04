import { Link } from 'react-router-dom';
const logoPath = '/assets/images/Strangers_Play_logo.png';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="brand-nav">
        <Link to="/" className="brand-mark">
          <img src={logoPath} alt="Green Lynk" className="brand-logo" />
          <div>
            <strong>Green Lynk</strong>
            <span>Social chat, groups, invites, media</span>
          </div>
        </Link>
        <div className="brand-nav-actions">
          <Link to="/login" className="nav-link subtle">Login</Link>
          <Link to="/register" className="nav-link primary">Start Free</Link>
        </div>
      </header>

      <main className="hero-grid">
        <section className="hero-copy">
          <div className="eyebrow">Built For Real Connections</div>
          <h3>Meet, chat, share, and invite people into a social space that feels alive.</h3>
          <p>
            Green Lynk blends connection requests, rich chat, media sharing, stickers, groups, and invite-driven growth into one playful experience built for launch.
          </p>
          <br></br>
          <div className="hero-actions">
            <Link to="/register" className="cta-button">Create Your Account</Link>
            <Link to="/login" className="cta-link">I already have an account</Link>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <strong>Private Connections</strong>
              <span>Chat starts only after people accept.</span>
            </div>
            <div className="stat-card">
              <strong>Rich Messaging</strong>
              <span>Photos, attachments, stickers, emoji, invites.</span>
            </div>
            <div className="stat-card">
              <strong>Launch Ready</strong>
              <span>Production branding around your real identity.</span>
            </div>
          </div>
        </section>

        <section className="hero-showcase">
          <div className="showcase-panel accent">
            <span className="showcase-label">Invite Friends</span>
            <h3>Grow through email invitations</h3>
            <p>Bring people in with direct registration links that feel personal, not spammy.</p>
          </div>
          <div className="showcase-panel">
            <span className="showcase-label">Media Rich</span>
            <h3>Share moments instantly</h3>
            <p>Photos, files, stickers, emoji, and live chat all sit inside one polished conversation flow.</p>
          </div>
          <div className="showcase-panel dark">
            <span className="showcase-label">Safe Start</span>
            <h3>Connection-first messaging</h3>
            <p>Search people, send requests, accept thoughtfully, and keep conversations intentional.</p>
          </div>
        </section>
      </main>

      <section className="feature-ribbon">
        <div className="feature-tile">
          <strong>Brand-Led Launch</strong>
          <span>Logo-forward layout with a more memorable visual identity.</span>
        </div>
        <div className="feature-tile">
          <strong>Modern Community Flow</strong>
          <span>Invites, connections, group chat, and rich media in one surface.</span>
        </div>
        <div className="feature-tile">
          <strong>Mobile Friendly</strong>
          <span>Responsive layouts from the first impression through the chat experience.</span>
        </div>
      </section>
    </div>
  );
}

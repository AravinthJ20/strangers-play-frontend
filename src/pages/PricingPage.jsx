import { useEffect, useState } from 'react';
import { appConfig } from '../config';
import { activatePremium, fetchProfile } from '../services/api';

export default function PricingPage() {
  const token = localStorage.getItem('token');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);
  const supportPhoneHref = appConfig.supportPhone.replace(/\s/g, '');

  useEffect(() => {
    if (!token) return;

    fetchProfile(token)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleActivatePremium = async () => {
    if (!token) return;
    setActivating(true);
    setError('');
    setStatus('');

    try {
      await activatePremium(token);
      setProfile((prev) => ({ ...(prev || {}), premium: true }));
      setStatus('Premium activated successfully. Refresh the app or visit your profile to see the new status.');
    } catch (activateError) {
      setError(activateError.response?.data?.error || 'Unable to activate premium at this time.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <main className="static-page">
      <h1>Pricing</h1>
      <p>
        Green Lynk offers clear pricing for individuals, growing communities, and
        teams that need premium support.
      </p>
      <section>
        <h2>Available plans</h2>
        <div className="pricing-plan-grid">
          <article className="pricing-plan-card">
            <h3>Starter</h3>
            <strong>Free</strong>
            <p>Basic chat, connection requests, groups, and profile features.</p>
          </article>
          <article className="pricing-plan-card">
            <h3>Premium</h3>
            <strong>Rs. 199 / month</strong>
            <p>Priority support, premium discovery, and early access to advanced tools.</p>
          </article>
          <article className="pricing-plan-card">
            <h3>Community</h3>
            <strong>Rs. 999 / month</strong>
            <p>Premium access for community workflows, onboarding help, and custom support.</p>
          </article>
        </div>
      </section>
      <section>
        <h2>Premium access</h2>
        <p>
          Premium unlocks priority support and exclusive access to advanced community tools.
          If you are already logged in, upgrade instantly with the button below.
        </p>
        {token ? (
          <div className="pricing-cta-block">
            {loading ? (
              <div>Loading account details...</div>
            ) : profile?.premium ? (
              <div className="pricing-status-banner">You are already a premium member.</div>
            ) : (
              <>
                {status && <div className="auth-info">{status}</div>}
                {error && <div className="auth-error">{error}</div>}
                <button className="button button-primary" onClick={handleActivatePremium} disabled={activating}>
                  {activating ? 'Activating premium...' : 'Activate Premium'}
                </button>
              </>
            )}
          </div>
        ) : (
          <p>
            Please <a href="/login">log in</a> or <a href="/register">register</a> to activate premium and receive priority support.
          </p>
        )}
      </section>
      <section>
        <h2>Request a quote</h2>
        <p>
          Contact us to receive a detailed quote based on your expected number of users and feature requirements.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Email: <a href={`mailto:${appConfig.supportEmail}`}>{appConfig.supportEmail}</a></p>
        <p className="is-hidden">Phone: <a href={`tel:${supportPhoneHref}`}>{appConfig.supportPhone}</a></p>
      </section>
    </main>
  );
}

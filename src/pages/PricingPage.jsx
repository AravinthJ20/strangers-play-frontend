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
        Green Lynk offers flexible pricing designed for growing communities and teams.
        We recommend contacting us for a custom pricing plan that matches your usage and support needs.
      </p>
      <section>
        <h2>Available plans</h2>
        <ul>
          <li>Starter: basic chat and connection features for small communities.</li>
          <li>Growth: advanced media, group management, and onboarding support.</li>
          <li>Premium: dedicated support, custom branding, and priority delivery.</li>
        </ul>
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
                  {activating ? 'Activating premium…' : 'Activate Premium'}
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
      </section>
    </main>
  );
}

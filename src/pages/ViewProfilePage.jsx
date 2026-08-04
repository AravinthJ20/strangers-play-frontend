import { useEffect, useState } from 'react';
import { FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { fetchProfile } from '../services/api';

const getInitials = (value) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SP';

const formatJoinDate = (value) => {
  if (!value) return 'Recently joined';
  return `Joined ${new Date(value).toLocaleDateString()}`;
};

export default function ViewProfilePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile(token)
      .then(setProfile)
      .catch((loadError) => setError(loadError.response?.data?.error || 'Unable to load your profile right now.'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <strong className="eyebrow">Your Profile</strong>
          <h1>View profile</h1>
          <p>See how your identity appears across Green Lynk.</p>
        </div>
        <div className="profile-header-actions">
          <button className="profile-action-button profile-secondary-button button-with-icon" onClick={() => navigate('/chat')}>
            <FiArrowLeft className="ui-icon" />
            Back to Chat
          </button>
          <button className="profile-action-button profile-primary-button button-with-icon" onClick={() => navigate('/edit/profile')}>
            <FiEdit2 className="ui-icon" />
            Edit Profile
          </button>
        </div>
      </header>

      <section className="profile-shell">
        {error && <div className="chat-error-banner">{error}</div>}
        {loading ? (
          <div className="empty-state">Loading profile...</div>
        ) : profile ? (
          <>
            <article className="profile-hero-card">
              <div className="profile-avatar-large">
                {profile.avatar ? <img src={profile.avatar} alt={profile.username} className="profile-avatar-image" /> : getInitials(profile.username)}
              </div>
              <div className="profile-hero-copy">
                <strong>{profile.username}</strong>
                <span>{profile.email}</span>
                <small>{profile.online ? 'Online now' : 'Available on Green Lynk'}</small>
                <p>{profile.bio || 'Add a short bio in Edit Profile so people understand your vibe faster.'}</p>
              </div>
            </article>

            <div className="profile-grid">
              <article className="profile-card">
                <h3>About</h3>
                <div className="profile-info-list">
                  <div>
                    <span>Location</span>
                    <strong>{profile.location || 'Not added yet'}</strong>
                  </div>
                  <div>
                    <span>Member since</span>
                    <strong>{formatJoinDate(profile.createdAt)}</strong>
                  </div>
                </div>
              </article>

              <article className="profile-card">
                <h3>Interests</h3>
                {profile.interests?.length ? (
                  <div className="profile-chip-list">
                    {profile.interests.map((interest) => (
                      <span key={interest} className="profile-chip">{interest}</span>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state slim">No interests added yet.</div>
                )}
              </article>

              <article className="profile-card">
                <h3>Stats</h3>
                <div className="profile-stat-grid">
                  <div className="profile-stat-item">
                    <strong>{profile.stats?.connections ?? 0}</strong>
                    <span>Connections</span>
                  </div>
                  <div className="profile-stat-item">
                    <strong>{profile.stats?.sentRequests ?? 0}</strong>
                    <span>Sent Requests</span>
                  </div>
                  <div className="profile-stat-item">
                    <strong>{profile.stats?.receivedRequests ?? 0}</strong>
                    <span>Received Requests</span>
                  </div>
                </div>
              </article>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

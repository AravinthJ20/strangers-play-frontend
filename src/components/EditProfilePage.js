import { useEffect, useState } from 'react';
import { FiArrowLeft, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { fetchProfile, updateProfile } from '../api';

const buildInitialState = (profile) => ({
  username: profile?.username || '',
  email: profile?.email || '',
  avatar: profile?.avatar || '',
  bio: profile?.bio || '',
  location: profile?.location || '',
  interests: Array.isArray(profile?.interests) ? profile.interests.join(', ') : ''
});

export default function EditProfilePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [form, setForm] = useState(buildInitialState());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchProfile(token)
      .then((profile) => setForm(buildInitialState(profile)))
      .catch((loadError) => setError(loadError.response?.data?.error || 'Unable to load your profile right now.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setError('');
    setStatus('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setStatus('');

    try {
      const payload = {
        username: form.username,
        avatar: form.avatar,
        bio: form.bio,
        location: form.location,
        interests: form.interests
      };
      await updateProfile(payload, token);
      setStatus('Profile updated successfully.');
      navigate('/view/profile');
    } catch (saveError) {
      setError(saveError.response?.data?.error || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <strong className="eyebrow">Profile Settings</strong>
          <h1>Edit profile</h1>
          <p>Update the details people will see when they connect with you.</p>
        </div>
        <div className="profile-header-actions">
          <button className="ghost-button button-with-icon" onClick={() => navigate('/view/profile')}>
            <FiEye className="ui-icon" />
            View Profile
          </button>
          <button className="ghost-button button-with-icon" onClick={() => navigate('/chat')}>
            <FiArrowLeft className="ui-icon" />
            Back to Chat
          </button>
        </div>
      </header>

      <section className="profile-shell">
        {loading ? (
          <div className="empty-state">Loading profile editor...</div>
        ) : (
          <form className="profile-form-card" onSubmit={handleSubmit}>
            <h3>Profile Details</h3>
            {error && <div className="auth-error">{error}</div>}
            {status && <div className="auth-info">{status}</div>}
            <label className="profile-field">
              <span>Username</span>
              <input value={form.username} onChange={handleChange('username')} placeholder="Your username" required />
            </label>
            <label className="profile-field">
              <span>Email</span>
              <input value={form.email} placeholder="Your email" readOnly />
            </label>
            <label className="profile-field">
              <span>Avatar URL</span>
              <input value={form.avatar} onChange={handleChange('avatar')} placeholder="https://example.com/avatar.jpg" />
            </label>
            <label className="profile-field">
              <span>Location</span>
              <input value={form.location} onChange={handleChange('location')} placeholder="City, Country" />
            </label>
            <label className="profile-field">
              <span>Interests</span>
              <input value={form.interests} onChange={handleChange('interests')} placeholder="Music, travel, gaming" />
            </label>
            <label className="profile-field">
              <span>Bio</span>
              <textarea value={form.bio} onChange={handleChange('bio')} placeholder="Tell people a little about yourself" rows={5} />
            </label>
            <div className="profile-form-actions">
              <button type="button" className="ghost-button" onClick={() => navigate('/view/profile')}>Cancel</button>
              <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

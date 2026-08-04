import { useEffect, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { acceptInterest, fetchRequests, rejectInterest } from '../services/api';

const getInitials = (value) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SP';

const renderAvatar = (person) => (
  <div className="people-card-avatar people-list-avatar">
    {person.avatar ? (
      <img src={person.avatar} alt={person.username} className="people-card-avatar-image" />
    ) : (
      getInitials(person.username)
    )}
  </div>
);

export default function RequestsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests(token)
      .then((data) => setRequests(data.incoming || []))
      .catch((loadError) => setError(loadError.response?.data?.error || 'Unable to load requests right now.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (userId) => {
    try {
      await acceptInterest(userId, token);
      setRequests((prev) => prev.filter((entry) => entry._id !== userId));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to accept this request.');
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectInterest(userId, token);
      setRequests((prev) => prev.filter((entry) => entry._id !== userId));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to reject this request.');
    }
  };

  return (
    <div className="people-page">
      <header className="people-header">
        <div>
          <strong className="eyebrow">Received Requests</strong>
          <h1>Review interested profiles</h1>
          <p>Accept the profiles you want to connect with, or reject the ones you want to skip.</p>
        </div>
        <div className="people-header-actions">
          <button className="ghost-button button-with-icon" onClick={() => navigate('/chat')}>
            <FiArrowLeft className="ui-icon" />
            Back to Chat
          </button>
        </div>
      </header>

      <div className="people-top-nav">
        <button className="people-top-nav-link" type="button" onClick={() => navigate('/people')}>People</button>
        <button className="people-top-nav-link active" type="button" onClick={() => navigate('/requests')}>Requests</button>
        <button className="people-top-nav-link" type="button" onClick={() => navigate('/connections')}>Connections</button>
      </div>

      <section className="people-list-shell">
        {error && <div className="chat-error-banner">{error}</div>}
        {loading ? (
          <div className="empty-state">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">No received requests right now.</div>
        ) : (
          <div className="people-list-grid">
            {requests.map((person) => (
              <article key={person._id} className="people-list-card">
                <div className="people-list-card-head">
                  {renderAvatar(person)}
                  <div className="people-card-copy">
                    <strong>{person.username}</strong>
                    <span>{person.email}</span>
                    <small>{person.online ? 'Online now' : 'Interested in connecting'}</small>
                  </div>
                </div>
                <div className="people-list-card-footer">
                  <span className="status-label pending">Interested</span>
                  <div className="people-list-card-actions">
                    <button className="ghost-button" type="button" onClick={() => handleReject(person._id)}>Reject</button>
                    <button className="people-connect-button" type="button" onClick={() => handleAccept(person._id)}>Accept</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

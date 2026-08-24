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
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activeRequestView, setActiveRequestView] = useState('received');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests(token)
      .then((data) => {
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
      })
      .catch((loadError) => setError(loadError.response?.data?.error || 'Unable to load requests right now.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (userId) => {
    try {
      await acceptInterest(userId, token);
      setIncomingRequests((prev) => prev.filter((entry) => entry._id !== userId));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to accept this request.');
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectInterest(userId, token);
      setIncomingRequests((prev) => prev.filter((entry) => entry._id !== userId));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to reject this request.');
    }
  };

  const visibleRequests = activeRequestView === 'received' ? incomingRequests : outgoingRequests;

  return (
    <div className="people-page">
      <header className="people-header">
        <div>
          <strong className="eyebrow">Connection Requests</strong>
          <h1>Review your request activity</h1>
          <p>Accept received requests, or check the people you already sent requests to.</p>
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
        <div className="request-view-tabs" role="tablist" aria-label="Request type">
          <button
            className={`request-view-tab${activeRequestView === 'received' ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveRequestView('received')}
          >
            Received ({incomingRequests.length})
          </button>
          <button
            className={`request-view-tab${activeRequestView === 'sent' ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveRequestView('sent')}
          >
            Sent ({outgoingRequests.length})
          </button>
        </div>

        {error && <div className="chat-error-banner">{error}</div>}
        {loading ? (
          <div className="empty-state">Loading requests...</div>
        ) : visibleRequests.length === 0 ? (
          <div className="empty-state">
            {activeRequestView === 'received'
              ? 'No received requests right now.'
              : 'No sent requests right now.'}
          </div>
        ) : (
          <div className="people-list-grid">
            {visibleRequests.map((person) => (
              <article key={person._id} className="people-list-card">
                <div className="people-list-card-head">
                  {renderAvatar(person)}
                  <div className="people-card-copy">
                    <strong>{person.username}</strong>
                    <span>{person.email}</span>
                    <small>
                      {person.online
                        ? 'Online now'
                        : activeRequestView === 'received'
                          ? 'Interested in connecting'
                          : 'Waiting for response'}
                    </small>
                  </div>
                </div>
                <div className="people-list-card-footer">
                  <span className="status-label pending">
                    {activeRequestView === 'received' ? 'Interested' : 'Request Sent'}
                  </span>
                  {activeRequestView === 'received' && (
                    <div className="people-list-card-actions">
                      <button className="ghost-button" type="button" onClick={() => handleReject(person._id)}>Reject</button>
                      <button className="people-connect-button" type="button" onClick={() => handleAccept(person._id)}>Accept</button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { fetchFeed, fetchProfile, fetchPremiumRecommendations, ignoreUser, sendInterest } from '../services/api';

const getInitials = (value) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SP';

const getFeedStatusLabel = (status) => {
  if (status === 'accepted') return 'Accepted';
  if (status === 'interested') return 'Interested';
  if (status === 'rejected') return 'Rejected';
  if (status === 'ignored') return 'Ignored';
  return 'Open to connect';
};

const renderAvatar = (person, className = '') => (
  <div className={`people-card-avatar${className ? ` ${className}` : ''}`}>
    {person.avatar ? (
      <img src={person.avatar} alt={person.username} className="people-card-avatar-image" />
    ) : (
      getInitials(person.username)
    )}
  </div>
);

export default function PeoplePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [people, setPeople] = useState([]);
  const [profile, setProfile] = useState(null);
  const [premiumRecommendations, setPremiumRecommendations] = useState([]);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [dragState, setDragState] = useState({ id: '', startX: 0, offsetX: 0, dragging: false });
  const [loading, setLoading] = useState(true);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeed(token)
      .then(setPeople)
      .catch((loadError) => setError(loadError.response?.data?.error || 'Unable to load people right now.'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetchProfile(token)
      .then(setProfile)
      .catch(() => {})
      .finally(() => {
        /* ignore profile load failure here */
      });
  }, [token]);

  useEffect(() => {
    if (!token || !profile?.premium) {
      setPremiumRecommendations([]);
      return;
    }

    setPremiumLoading(true);
    fetchPremiumRecommendations(token)
      .then(setPremiumRecommendations)
      .catch(() => setPremiumRecommendations([]))
      .finally(() => setPremiumLoading(false));
  }, [profile?.premium, token]);

  const visiblePeople = useMemo(
    () => {
      const term = (peopleSearch || '').trim().toLowerCase();
      return people.filter((person) => {
        if (hiddenIds.includes(person._id)) return false;
        if (['accepted', 'interested'].includes(person.connectionStatus)) return false;
        if (!term) return true;
        return (
          (person.username || '').toLowerCase().includes(term) ||
          (person.email || '').toLowerCase().includes(term)
        );
      });
    },
    [people, hiddenIds, peopleSearch]
  );

  const topPerson = visiblePeople[0];
  const nextPeople = visiblePeople.slice(1, 4);

  const hidePerson = (personId, nextStatus) => {
    setPeople((prev) => prev.map((entry) => (entry._id === personId ? { ...entry, connectionStatus: nextStatus || entry.connectionStatus } : entry)));
    setHiddenIds((prev) => [...prev, personId]);
  };

  const handleIgnore = async (personId) => {
    try {
      await ignoreUser(personId, token);
      hidePerson(personId, 'ignored');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to ignore this profile right now.');
    }
  };

  const handleInterested = async (person) => {
    if (!person) return;
    if (person.connectionStatus === 'accepted' || person.connectionStatus === 'interested') {
      hidePerson(person._id, person.connectionStatus);
      return;
    }

    try {
      await sendInterest(person._id, token);
      hidePerson(person._id, 'interested');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to send interest right now.');
    }
  };

  const handlePointerDown = (event, personId) => {
    setDragState({ id: personId, startX: event.clientX, offsetX: 0, dragging: true });
  };

  const handlePointerMove = (event) => {
    if (!dragState.dragging) return;
    setDragState((prev) => ({ ...prev, offsetX: event.clientX - prev.startX }));
  };

  const handlePointerUp = () => {
    if (!dragState.dragging || !topPerson) {
      setDragState({ id: '', startX: 0, offsetX: 0, dragging: false });
      return;
    }

    if (dragState.offsetX <= -110) {
      void handleIgnore(topPerson._id);
    } else if (dragState.offsetX >= 110) {
      void handleInterested(topPerson);
    }

    setDragState({ id: '', startX: 0, offsetX: 0, dragging: false });
  };

  return (
    <div className="people-page" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <header className="people-header">
        <div>
          <strong className="eyebrow">People Feed</strong>
          <h1>Meet new people on Green Lynk</h1>
          <p>Browse the feed, ignore profiles you want to skip, and mark interested when you want to connect.</p>
        </div>
          <div className="people-header-actions">
            <input
              className="people-search-input"
              value={peopleSearch}
              onChange={(e) => setPeopleSearch(e.target.value)}
              placeholder="Search people by name or email..."
            />
            <button className="ghost-button button-with-icon" onClick={() => navigate('/chat')}>
              <FiArrowLeft className="ui-icon" />
              Back to Chat
            </button>
          </div>
      </header>

      {profile?.premium ? (
        <section className="people-premium-panel">
          <div className="premium-header">
            <strong className="eyebrow">Premium Discovery</strong>
            <p>As a premium member, you get access to a special recommendations panel.</p>
          </div>
          {premiumLoading ? (
            <div className="empty-state slim">Loading premium recommendations...</div>
          ) : premiumRecommendations.length ? (
            <div className="premium-recommendation-list">
              {premiumRecommendations.map((person) => (
                <article key={person._id} className="premium-recommendation-card">
                  {renderAvatar(person)}
                  <div className="premium-recommendation-copy">
                    <strong>{person.username}</strong>
                    <span>{person.email}</span>
                    <small>{person.online ? 'Online now' : 'Available to connect'}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state slim">No premium recommendations available yet.</div>
          )}
        </section>
      ) : (
        <div className="premium-cta-banner">
          Upgrade to premium on the <a href="/pricing">Pricing</a> page to unlock premium recommendations and priority discovery.
        </div>
      )}

      <div className="people-top-nav">
        <button className="people-top-nav-link active" type="button" onClick={() => navigate('/people')}>People</button>
        <button className="people-top-nav-link" type="button" onClick={() => navigate('/requests')}>Requests</button>
        <button className="people-top-nav-link" type="button" onClick={() => navigate('/connections')}>Connections</button>
      </div>

      <section className="people-shell">
        <main className="people-deck-stage">
          {error && <div className="chat-error-banner">{error}</div>}
          {loading ? (
            <div className="empty-state">Loading feed...</div>
          ) : topPerson ? (
            <div className="people-deck">
              {nextPeople.reverse().map((person, index) => (
                <div key={person._id} className={`people-card people-card-stack stack-${index + 1}`}>
                  {renderAvatar(person)}
                  <div className="people-card-copy">
                    <strong>{person.username}</strong>
                    <span>{person.email}</span>
                  </div>
                </div>
              ))}

              <div
                className="people-card people-card-primary"
                style={{ transform: dragState.id === topPerson._id ? `translateX(${dragState.offsetX}px) rotate(${dragState.offsetX / 18}deg)` : undefined }}
                onPointerDown={(event) => handlePointerDown(event, topPerson._id)}
              >
                <div className="people-swipe-hints">
                  <span className="ignore">Ignore</span>
                  <span className="connect">Interested</span>
                </div>
                {renderAvatar(topPerson, 'hero')}
                <div className="people-card-copy">
                  <strong>{topPerson.username}</strong>
                  <span>{topPerson.email}</span>
                  <small>{topPerson.online ? 'Online now' : 'Available to connect'}</small>
                </div>
                <div className="people-card-status-row">
                  <span className={`status-label ${topPerson.connectionStatus === 'accepted' ? 'connected' : 'pending'}`}>
                    {getFeedStatusLabel(topPerson.connectionStatus)}
                  </span>
                </div>
                <div className="people-card-actions">
                  <button className="ghost-button people-ignore-button" onClick={() => void handleIgnore(topPerson._id)}>Ignore</button>
                  <button className="people-connect-button" onClick={() => void handleInterested(topPerson)}>
                    Interested
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">No more profiles in the feed right now.</div>
          )}
        </main>
      </section>
    </div>
  );
}

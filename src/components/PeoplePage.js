import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDiscoverPeople, sendConnectionRequest } from '../api';

const getInitials = (value) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SP';

export default function PeoplePage({ user }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [people, setPeople] = useState([]);
  const [ignoredIds, setIgnoredIds] = useState([]);
  const [dragState, setDragState] = useState({ id: '', startX: 0, offsetX: 0, dragging: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDiscoverPeople(token)
      .then(setPeople)
      .catch((loadError) => setError(loadError.response?.data?.error || 'Unable to load people right now.'))
      .finally(() => setLoading(false));
  }, [token]);

  const visiblePeople = useMemo(
    () => people.filter((person) => !ignoredIds.includes(person._id)),
    [people, ignoredIds]
  );

  const topPerson = visiblePeople[0];
  const nextPeople = visiblePeople.slice(1, 4);

  const removePersonFromDeck = (personId, nextStatus) => {
    setPeople((prev) => prev.map((entry) => (entry._id === personId ? { ...entry, connectionStatus: nextStatus || entry.connectionStatus } : entry)));
    setIgnoredIds((prev) => [...prev, personId]);
  };

  const handleIgnore = (personId) => {
    removePersonFromDeck(personId);
  };

  const handleConnect = async (person) => {
    if (!person || person.connectionStatus === 'connected' || person.connectionStatus === 'outgoing') {
      removePersonFromDeck(person._id, person.connectionStatus);
      return;
    }

    try {
      await sendConnectionRequest(person._id, token);
      removePersonFromDeck(person._id, 'outgoing');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to send connection request.');
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
      handleIgnore(topPerson._id);
    } else if (dragState.offsetX >= 110) {
      handleConnect(topPerson);
    }

    setDragState({ id: '', startX: 0, offsetX: 0, dragging: false });
  };

  return (
    <div className="people-page" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <header className="people-header">
        <div>
          <strong className="eyebrow">Discover People</strong>
          <h1>Meet new people on Strangers Play</h1>
          <p>Swipe left to ignore, swipe right to send a connection request, just like a polished social matching flow.</p>
        </div>
        <div className="people-header-actions">
          <button className="ghost-button" onClick={() => navigate('/chat')}>Back to Chat</button>
        </div>
      </header>

      <section className="people-shell">
        <aside className="people-sidebar-card">
          <div className="people-profile">
            <div className="people-avatar">{getInitials(user.username)}</div>
            <div>
              <strong>{user.username}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <div className="people-sidebar-copy">
            <strong>How it works</strong>
            <p>Browse public member cards, swipe left to skip, and swipe right to send a connection request instantly.</p>
          </div>
        </aside>

        <main className="people-deck-stage">
          {error && <div className="chat-error-banner">{error}</div>}
          {loading ? (
            <div className="empty-state">Loading people...</div>
          ) : topPerson ? (
            <div className="people-deck">
              {nextPeople.reverse().map((person, index) => (
                <div key={person._id} className={`people-card people-card-stack stack-${index + 1}`}>
                  <div className="people-card-avatar">{getInitials(person.username)}</div>
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
                  <span className="connect">Connect</span>
                </div>
                <div className="people-card-avatar hero">{getInitials(topPerson.username)}</div>
                <div className="people-card-copy">
                  <strong>{topPerson.username}</strong>
                  <span>{topPerson.email}</span>
                  <small>{topPerson.online ? 'Online now' : 'Available to connect'}</small>
                </div>
                <div className="people-card-status-row">
                  <span className={`status-label ${topPerson.connectionStatus === 'connected' ? 'connected' : 'pending'}`}>
                    {topPerson.connectionStatus === 'connected'
                      ? 'Connected'
                      : topPerson.connectionStatus === 'outgoing'
                        ? 'Request sent'
                        : topPerson.connectionStatus === 'incoming'
                          ? 'Requested you'
                          : 'Open to connect'}
                  </span>
                </div>
                <div className="people-card-actions">
                  <button className="ghost-button people-ignore-button" onClick={() => handleIgnore(topPerson._id)}>Ignore</button>
                  <button className="people-connect-button" onClick={() => handleConnect(topPerson)}>
                    {topPerson.connectionStatus === 'outgoing' ? 'Sent' : topPerson.connectionStatus === 'connected' ? 'Connected' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">No more people to show right now.</div>
          )}
        </main>
      </section>
    </div>
  );
}

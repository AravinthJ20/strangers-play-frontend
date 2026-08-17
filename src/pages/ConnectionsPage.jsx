// import { useEffect, useState } from 'react';
// import { FiArrowLeft } from 'react-icons/fi';
// import { useNavigate } from 'react-router-dom';
// import { fetchConnections } from '../services/api';
// import '../searchBox.css';

// const getInitials = (value) =>
//   value
//     .split(' ')
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((part) => part[0]?.toUpperCase())
//     .join('') || 'SP';

// const renderAvatar = (person) => (
//   <div className="people-card-avatar people-list-avatar">
//     {person.avatar ? (
//       <img src={person.avatar} alt={person.username} className="people-card-avatar-image" />
//     ) : (
//       getInitials(person.username)
//     )}
//   </div>
// );

// export default function ConnectionsPage() {
//   const navigate = useNavigate();
//   const token = localStorage.getItem('token');
//   const [connections, setConnections] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchConnections(token)
//       .then(setConnections)
//       .catch((loadError) => setError(loadError.response?.data?.error || 'Unable to load connections right now.'))
//       .finally(() => setLoading(false));
//   }, [token]);

//   const handleOpenChat = (person) => {
//   navigate('/chat', {
//     state: {
//       selectedUser: person,
//     },
//   });
// };
//   return (
//     <div className="people-page">
//       <header className="people-header">
//         <div>
//           <strong className="eyebrow">Accepted Profiles</strong>
//           <h1>Your connections</h1>
//           <p>These are the profiles you have already accepted and can continue chatting with.</p>
//         </div>
//         <div className="people-header-actions">
//           <button className="ghost-button button-with-icon" onClick={() => navigate('/chat')}>
//             <FiArrowLeft className="ui-icon" />
//             Back to Chat
//           </button>
//         </div>
//       </header>

//       <div className="people-top-nav">
//         <button className="people-top-nav-link" type="button" onClick={() => navigate('/people')}>People</button>
//         <button className="people-top-nav-link" type="button" onClick={() => navigate('/requests')}>Requests</button>
//         <button className="people-top-nav-link active" type="button" onClick={() => navigate('/connections')}>Connections</button>
//       </div>

//       <section className="people-list-shell">
//         {error && <div className="chat-error-banner">{error}</div>}
//         {loading ? (
//           <div className="empty-state">Loading connections...</div>
//         ) : connections.length === 0 ? (
//           <div className="empty-state">No accepted profiles yet.</div>
//         ) : (
//           <div className="people-list-grid">
//             {connections.map((person) => (
//               <article key={person._id} className="people-list-card">
//                 <div className="people-list-card-head">
//                   {renderAvatar(person)}
//                   <div className="people-card-copy">
//                     <strong>{person.username}</strong>
//                     <span>{person.email}</span>
//                     <small>{person.online ? 'Online now' : 'Available in chat'}</small>
//                   </div>
//                 </div>
//                 <div className="people-list-card-footer">
//                   <span className="status-label connected">Accepted</span>
//                  <button
//   className="people-connect-button people-list-cta"
//   type="button"
//   onClick={() => handleOpenChat(person)}
// >
//   Open Chat
// </button>
//                 </div>
//               </article>
//             ))}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }
//search box added below

import { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiSearch, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { fetchConnections } from '../services/api';
import '../searchBox.css';

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
      <img
        src={person.avatar}
        alt={person.username}
        className="people-card-avatar-image"
      />
    ) : (
      getInitials(person.username)
    )}
  </div>
);

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [connections, setConnections] = useState([]);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConnections(token)
      .then(setConnections)
      .catch((loadError) =>
        setError(
          loadError.response?.data?.error ||
            'Unable to load connections right now.'
        )
      )
      .finally(() => setLoading(false));
  }, [token]);

  const filteredConnections = useMemo(() => {
    const term = peopleSearch.trim().toLowerCase();

    if (!term) {
      return connections;
    }

    return connections.filter(
      (person) =>
        (person.username || '').toLowerCase().includes(term) ||
        (person.email || '').toLowerCase().includes(term)
    );
  }, [connections, peopleSearch]);

  const handleOpenChat = (person) => {
    navigate('/chat', {
      state: {
        selectedUser: person,
      },
    });
  };

  return (
    <div className="people-page">
      <header className="people-header">
        <div>
          <strong className="eyebrow">Accepted Profiles</strong>

          <h1>Your connections</h1>

          <p>
            These are the profiles you have already accepted and can continue
            chatting with.
          </p>
        </div>

        <div className="people-header-actions">
          {/* Search */}
          <div className="people-search-box">
            <FiSearch className="people-search-icon" />

            <input
              className="people-search-input"
              value={peopleSearch}
              onChange={(e) => setPeopleSearch(e.target.value)}
              placeholder="Search people..."
              type="search"
            />

            {peopleSearch && (
              <button
                type="button"
                className="people-search-clear"
                onClick={() => setPeopleSearch('')}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* Back */}
          <button
            className="ghost-button button-with-icon"
            onClick={() => navigate('/chat')}
          >
            <FiArrowLeft className="ui-icon" />
            Back to Chat
          </button>
        </div>
      </header>

      <div className="people-top-nav">
        <button
          className="people-top-nav-link"
          type="button"
          onClick={() => navigate('/people')}
        >
          People
        </button>

        <button
          className="people-top-nav-link"
          type="button"
          onClick={() => navigate('/requests')}
        >
          Requests
        </button>

        <button
          className="people-top-nav-link active"
          type="button"
          onClick={() => navigate('/connections')}
        >
          Connections
        </button>
      </div>

      <section className="people-list-shell">
        {error && <div className="chat-error-banner">{error}</div>}

        {loading ? (
          <div className="empty-state">
            Loading connections...
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="empty-state">
            {peopleSearch
              ? `No connections found for "${peopleSearch}".`
              : 'No accepted profiles yet.'}
          </div>
        ) : (
          <div className="people-list-grid">
            {filteredConnections.map((person) => (
              <article
                key={person._id}
                className="people-list-card"
              >
                <div className="people-list-card-head">
                  {renderAvatar(person)}

                  <div className="people-card-copy">
                    <strong>{person.username}</strong>

                    <span>{person.email}</span>

                    <small>
                      {person.online
                        ? 'Online now'
                        : 'Available in chat'}
                    </small>
                  </div>
                </div>

                <div className="people-list-card-footer">
                  <span className="status-label connected">
                    Accepted
                  </span>

                  <button
                    className="people-connect-button people-list-cta"
                    type="button"
                    onClick={() => handleOpenChat(person)}
                  >
                    Open Chat
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
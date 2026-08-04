import { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiImage, FiTrash2, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { appConfig } from '../../config';
import { createStatus, deleteStatus, fetchMyStatuses, fetchStatusFeed, markStatusViewed, uploadChatMedia } from '../../api';

const statusPalette = ['#17324f', '#0f766e', '#bc4749', '#7c3aed', '#f77f00', '#264653'];

const formatAge = (value) => {
  if (!value) return '';
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h ago`;
};

const resolveMediaSource = (publicUrl) => {
  if (!publicUrl) return '';
  if (/^https?:\/\//i.test(publicUrl)) return publicUrl;
  return `${appConfig.mediaBaseUrl}${publicUrl}`;
};

export function StatusPanel({ user, token, embedded = false, onClose }) {
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  const [activeTab, setActiveTab] = useState('post');
  const [draftText, setDraftText] = useState('');
  const [draftBackground, setDraftBackground] = useState(statusPalette[0]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const refreshStatuses = async () => {
    const [feedData, ownData] = await Promise.all([fetchStatusFeed(token), fetchMyStatuses(token)]);
    setFeed(feedData);
    setMyStatuses(ownData);
  };

  useEffect(() => {
    refreshStatuses().catch((loadError) => {
      setError(loadError.response?.data?.error || 'Unable to load statuses.');
    });
  }, [token]);

  const otherStatuses = useMemo(
    () => feed.filter((status) => status.owner?._id !== user._id),
    [feed, user._id]
  );

  const handleCreateTextStatus = async () => {
    if (!draftText.trim()) return;

    try {
      setError('');
      const created = await createStatus(
        {
          text: draftText.trim(),
          background: draftBackground
        },
        token
      );
      setDraftText('');
      setMyStatuses((prev) => [created, ...prev]);
      setFeed((prev) => [created, ...prev]);
    } catch (createError) {
      setError(createError.response?.data?.error || 'Unable to create status.');
    }
  };

  const handleUploadStatusImage = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      const reader = new FileReader();

      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsDataURL(file);
      });

      const uploaded = await uploadChatMedia(
        {
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          dataUrl
        },
        token
      );

      const created = await createStatus(
        {
          text: draftText.trim(),
          mediaId: uploaded._id,
          background: draftBackground
        },
        token
      );

      setDraftText('');
      setMyStatuses((prev) => [created, ...prev]);
      setFeed((prev) => [created, ...prev]);
    } catch (uploadError) {
      setError(uploadError.response?.data?.error || uploadError.message || 'Unable to upload status image.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId, token);
      setMyStatuses((prev) => prev.filter((status) => status._id !== statusId));
      setFeed((prev) => prev.filter((status) => status._id !== statusId));
    } catch (deleteError) {
      setError(deleteError.response?.data?.error || 'Unable to delete status.');
    }
  };

  const handleMarkViewed = async (status) => {
    if (!status?._id || status.owner?._id === user._id) return;

    try {
      const updated = await markStatusViewed(status._id, token);
      setFeed((prev) => prev.map((entry) => (entry._id === updated._id ? updated : entry)));
    } catch (viewError) {
      console.error('Unable to mark status viewed:', viewError);
    }
  };

  const panelContent = (
    <>
      <div className="modal-header">
        <div>
          <h3>Status</h3>
          <p>Share 24-hour updates with your connections like WhatsApp.</p>
        </div>
        {embedded ? (
          <button className="modal-close" onClick={() => navigate('/chat')}>
            <FiArrowLeft className="ui-icon" />
          </button>
        ) : (
          <button className="modal-close" onClick={onClose}>
            <FiX className="ui-icon" />
          </button>
        )}
      </div>

      {error && <div className="chat-error-banner">{error}</div>}

      <div className="status-tabs">
        <button className={activeTab === 'post' ? 'active' : ''} onClick={() => setActiveTab('post')}>
          Post
        </button>
        <button className={activeTab === 'view' ? 'active' : ''} onClick={() => setActiveTab('view')}>
          View
        </button>
      </div>

      {activeTab === 'post' ? (
        <>
          <div className="status-composer">
            <textarea
              className="status-textarea"
              placeholder="What's your vibe today?"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              style={{ '--status-bg': draftBackground }}
            />
            <div className="status-color-row">
              {statusPalette.map((color) => (
                <button
                  key={color}
                  className={`status-color-swatch ${draftBackground === color ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setDraftBackground(color)}
                  aria-label={`Choose ${color} background`}
                />
              ))}
            </div>
            <div className="status-composer-actions">
              <label className="ghost-button status-upload-button">
                <FiImage className="ui-icon" />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => handleUploadStatusImage(event.target.files?.[0])}
                />
                {uploading ? 'Uploading...' : 'Photo Status'}
              </label>
              <button onClick={handleCreateTextStatus} disabled={!draftText.trim() || uploading}>
                Post Status
              </button>
            </div>
          </div>

          <div className="status-section">
            <div className="status-section-header">
              <strong>Your Status</strong>
              <span>{myStatuses.length} active</span>
            </div>
            {myStatuses.length > 0 ? (
              <div className="status-grid">
                {myStatuses.map((status) => (
                  <div key={status._id} className="status-card" style={{ '--status-card-bg': status.background || '#17324f' }}>
                    {status.media?.publicUrl && <img src={resolveMediaSource(status.media.publicUrl)} alt="Status" className="status-card-image" />}
                    <div className="status-card-body">
                      <strong>{status.owner?.username || 'You'}</strong>
                      {status.text && <p>{status.text}</p>}
                      <div className="status-card-meta">
                        <small>{formatAge(status.createdAt)}</small>
                        <small>{status.viewers?.length || 0} views</small>
                      </div>
                    </div>
                    <button className="status-delete-button" onClick={() => handleDeleteStatus(status._id)}>
                      <FiTrash2 className="ui-icon" />
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state slim">No status updates yet.</div>
            )}
          </div>
        </>
      ) : (
        <div className="status-section">
          <div className="status-section-header">
            <strong>Connections</strong>
            <span>{otherStatuses.length} recent</span>
          </div>
          {otherStatuses.length > 0 ? (
            <div className="status-grid">
              {otherStatuses.map((status) => (
                <button
                  key={status._id}
                  className="status-card status-card-button"
                  style={{ '--status-card-bg': status.background || '#17324f' }}
                  onClick={() => handleMarkViewed(status)}
                >
                  {status.media?.publicUrl && <img src={resolveMediaSource(status.media.publicUrl)} alt="Status" className="status-card-image" />}
                  <div className="status-card-body">
                    <strong>{status.owner?.username || 'Connection'}</strong>
                    {status.text && <p>{status.text}</p>}
                    <div className="status-card-meta">
                      <small>{formatAge(status.createdAt)}</small>
                      <small>{status.viewers?.some((viewer) => viewer === user._id || viewer?._id === user._id) ? 'Viewed' : 'Tap to view'}</small>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state slim">No recent status updates from your connections.</div>
          )}
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="status-page">
        <div className="status-page-shell">
          <div className="status-page-card">
            {panelContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-card status-modal-card" onClick={(event) => event.stopPropagation()}>
        {panelContent}
      </div>
    </div>
  );
}

export default StatusPanel;

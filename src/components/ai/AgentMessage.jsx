import { FiPhone } from 'react-icons/fi';

export default function AgentMessage({ entry, onActionClick }) {
  return (
    <div className={`agent-message ${entry.role}${entry.ok === false ? ' error' : ''}`}>
      {entry.role === 'agent' && (
        <div className="agent-message-badge">
          <FiPhone className="ui-icon" />
        </div>
      )}
      <div className="agent-message-body">
        <div className="agent-message-text">{entry.text}</div>
        {entry.action?.type === 'start_call' && (
          <button className="agent-action-button" type="button" onClick={() => onActionClick?.(entry.action)}>
            <FiPhone className="ui-icon" />
            Call {entry.action.username}
          </button>
        )}
      </div>
    </div>
  );
}

import AgentMessage from './AgentMessage';
import ActionSuggestChips from './ActionSuggestChips';

export default function AgentChatWindow({ messages, loading, prompts, onSend, onActionClick }) {
  return (
    <div className="agent-shell">
      <div className="agent-chat-panel">
        <div className="agent-chat-feed">
          {messages.map((entry) => (
            <AgentMessage key={entry.id} entry={entry} onActionClick={onActionClick} />
          ))}
          {loading && (
            <div className="agent-message agent">
              <div className="agent-message-badge">
                <span className="ui-icon">⚡</span>
              </div>
              <div className="agent-message-body">
                <div className="agent-message-text agent-typing">Working on it...</div>
              </div>
            </div>
          )}
        </div>

        <ActionSuggestChips prompts={prompts} onSelect={onSend} disabled={loading} />
      </div>
    </div>
  );
}

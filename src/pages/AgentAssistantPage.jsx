import { useState } from 'react';
import { FiArrowLeft, FiPhone, FiSend } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../agent.css';
import useAgentChat from '../hooks/useAgentChat';
import AgentChatWindow from '../components/ai/AgentChatWindow';

const QUICK_PROMPTS = [
  'Connect me with Rahul',
  'Accept all pending requests',
  "Tell Rahul I'll be online at 8 PM",
  'Post "Happy Sunday everyone!"',
  'Delete my latest status',
  'Call Rahul',
  'Show everyone from Chennai',
  'Recommend people interested in Node.js',
  'Summarize my conversation with Rahul',
  'Remind me to call Rahul tomorrow at 6 PM'
];

export default function AgentPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [input, setInput] = useState('');
  const { messages, loading, bootError, sendMessage } = useAgentChat(token);

  const handleSend = async (rawText) => {
    const text = `${rawText || ''}`.trim();
    if (!text || loading) return;
    setInput('');
    await sendMessage(text);
  };

  const handleCallAction = (action) => {
    navigate('/chat', { state: { agentCall: action } });
  };

  return (
    <div className="agent-page">
      <header className="agent-header">
        <div>
          <strong className="eyebrow">Green Lynk AI Agent</strong>
          <h1>Take action with natural language</h1>
          <p>Connect, message, post status, call friends, search, summarize, and set reminders.</p>
        </div>
        <button className="ghost-button button-with-icon" type="button" onClick={() => navigate('/chat')}>
          <FiArrowLeft className="ui-icon" />
          Back to Chat
        </button>
      </header>

      {bootError && <div className="chat-error-banner">{bootError}</div>}

      <section className="agent-shell">
        <AgentChatWindow
          messages={messages}
          loading={loading}
          prompts={QUICK_PROMPTS}
          onSend={handleSend}
          onActionClick={handleCallAction}
        />

        <form
          className="agent-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend(input);
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder='Try "Connect me with Rahul" or "Post Happy Sunday!"'
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} aria-label="Send to agent">
            <FiSend className="ui-icon" />
          </button>
        </form>
      </section>
    </div>
  );

}

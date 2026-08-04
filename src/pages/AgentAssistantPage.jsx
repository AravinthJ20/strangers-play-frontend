import { useEffect, useState } from 'react';
import { FiArrowLeft, FiSend, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../agent.css';
import useAgentChat from '../hooks/useAgentChat';
import AgentChatWindow from '../components/ai/AgentChatWindow';
import { fetchPremiumInsights, fetchProfile } from '../services/api';

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
  const [profile, setProfile] = useState(null);
  const [premiumInsight, setPremiumInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(Boolean(token));
  const { messages, loading, bootError, sendMessage } = useAgentChat(token);

  useEffect(() => {
    if (!token) return;

    fetchProfile(token)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [token]);

  useEffect(() => {
    if (!token || !profile?.premium) {
      setPremiumInsight(null);
      return;
    }

    setInsightLoading(true);
    fetchPremiumInsights(token)
      .then(setPremiumInsight)
      .catch(() => setPremiumInsight(null))
      .finally(() => setInsightLoading(false));
  }, [profile?.premium, token]);

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
          <strong className="eyebrow">Lynk Assistant</strong>
          <h1>Ask for help in everyday words</h1>
          <p>Connect, message, post status, call friends, search, summarize, and set reminders.</p>
        </div>
        <button className="ghost-button button-with-icon" type="button" onClick={() => navigate('/chat')}>
          <FiArrowLeft className="ui-icon" />
          Back to Chat
        </button>
      </header>

      {bootError && <div className="chat-error-banner">{bootError}</div>}

      <section className={`premium-insight-card${profile?.premium ? ' active' : ''}`}>
        <div className="premium-insight-badge">
          <FiStar />
        </div>
        <div className="premium-insight-copy">
          <strong className="eyebrow">Premium Sample Feature</strong>
          <h2>{profile?.premium ? premiumInsight?.title || 'Premium AI Briefing' : 'Unlock a premium-only AI experience'}</h2>
          <p>
            {profile?.premium
              ? premiumInsight?.summary || 'Your premium briefing is ready and will help you move faster.'
              : 'Try a premium-only insight panel that highlights smart discovery tips and priority support.'}
          </p>
          {profile?.premium ? (
            <>
              {insightLoading ? (
                <p className="premium-insight-muted">Loading your premium briefing...</p>
              ) : (
                <ul className="premium-insight-list">
                  {(premiumInsight?.highlights || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <a className="premium-cta-link" href="/pricing">
              Upgrade to premium to unlock this feature
            </a>
          )}
        </div>
      </section>

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
          <button type="submit" disabled={loading || !input.trim()} aria-label="Ask assistant">
            <FiSend className="ui-icon" />
          </button>
        </form>
      </section>
    </div>
  );

}

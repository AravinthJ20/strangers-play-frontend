import { useEffect, useRef, useState } from 'react';
import { getAgentCapabilities, postAgentMessage } from '../services/agentService';

const buildAgentMessage = (text, payload = {}) => ({
  id: `agent-${Date.now()}`,
  role: 'agent',
  text,
  ok: true,
  ...payload
});

const buildUserMessage = (text) => ({
  id: `user-${Date.now()}`,
  role: 'user',
  text
});

export default function useAgentChat(token) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bootError, setBootError] = useState('');
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    getAgentCapabilities(token)
      .then((data) => {
        setMessages([buildAgentMessage(data.reply)]);
      })
      .catch((error) => {
        setBootError(error.response?.data?.error || 'Unable to load the AI agent right now.');
      });
  }, [token]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = `${text || ''}`.trim();
    if (!trimmed || loading) return;

    const userMessage = buildUserMessage(trimmed);
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const result = await postAgentMessage(trimmed, token);
      setMessages((prev) => [
        ...prev,
        buildAgentMessage(result.reply, {
          ok: result.ok !== false,
          action: result.action || null,
          data: result.data || null
        })
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        buildAgentMessage(error.response?.data?.error || 'Something went wrong. Please try again.', {
          ok: false
        })
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    bootError,
    messageEndRef,
    sendMessage
  };
}

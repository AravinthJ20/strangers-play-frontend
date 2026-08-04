import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useAgentCallBridge({
  connections,
  chats,
  activeChat,
  socket,
  loadConversationRef,
  startCallRef
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingCallRef = useRef(null);
  const handledCallIdRef = useRef('');

  useEffect(() => {
    const agentCall = location.state?.agentCall;
    if (!agentCall || agentCall.type !== 'start_call' || !socket) return;

    const callKey = `${agentCall.userId}:${agentCall.mode || 'voice'}`;
    if (handledCallIdRef.current === callKey) return;
    handledCallIdRef.current = callKey;

    const target =
      connections.find((entry) => entry._id === agentCall.userId) ||
      chats.find((entry) => entry._id === agentCall.userId) ||
      { _id: agentCall.userId, username: agentCall.username };

    pendingCallRef.current = {
      userId: agentCall.userId,
      mode: agentCall.mode || 'voice'
    };

    navigate('/chat', { replace: true, state: {} });
    void loadConversationRef.current?.(target);
  }, [location.state, socket, connections, chats, loadConversationRef, navigate]);

  useEffect(() => {
    const pending = pendingCallRef.current;
    if (!pending || !activeChat || activeChat._id !== pending.userId || activeChat.group) return;

    pendingCallRef.current = null;
    startCallRef.current?.(pending.mode);
  }, [activeChat, startCallRef]);
}

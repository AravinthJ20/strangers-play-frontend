import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { appConfig } from '../config';
import {
  acceptConnectionRequest,
  addGroupMembers,
  createGroup,
  fetchChatList,
  fetchConnectionRequests,
  fetchContacts,
  fetchGroupMessages,
  fetchGroups,
  fetchMessages,
  leaveGroup,
  logoutUser,
  rejectConnectionRequest,
  searchUsers,
  sendConnectionRequest,
  sendInviteEmail,
  subscribeToPush,
  uploadChatMedia
} from '../api';

const emojiSet = ['\u{1F600}', '\u{1F602}', '\u{1F60D}', '\u{1F525}', '\u2764\uFE0F', '\u{1F44D}', '\u{1F389}', '\u{1F60E}', '\u{1F91D}', '\u{1F64C}', '\u{1F973}', '\u2728'];
const stickerSet = ['\u{1F389}', '\u{1F525}', '\u{1F4AF}', '\u{1F602}', '\u{1F973}', '\u{1F929}', '\u{1F63A}', '\u{1F680}'];
const rtcConfig = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]
};

const toSessionDescriptionPayload = (description) => {
  if (!description) return null;

  const plainDescription = typeof description.toJSON === 'function' ? description.toJSON() : description;
  if (typeof plainDescription.type !== 'string' || typeof plainDescription.sdp !== 'string') {
    return null;
  }

  return {
    type: plainDescription.type,
    sdp: plainDescription.sdp
  };
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(normalized);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatLastSeen = (value) => {
  if (!value) return 'Offline';
  return `Last seen ${new Date(value).toLocaleString()}`;
};

const getInitials = (value) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SP';

const buildChatPreview = (item) => {
  if (item.isDeleted || item.lastMessage?.isDeleted) return 'Message deleted';
  if (item.location || item.lastMessage?.location || item.type === 'location' || item.lastMessage?.type === 'location') return 'Location';
  if (item.sticker || item.lastMessage?.sticker) return 'Sticker';
  if (item.type === 'call' || item.lastMessage?.type === 'call') {
    const callDetails = item.callDetails || item.lastMessage?.callDetails;
    if (callDetails) {
      return `${callDetails.mode === 'video' ? 'Video' : 'Voice'} call ${callDetails.status}`;
    }
    return 'Call activity';
  }
  const attachments = item.attachments || item.lastMessage?.attachments || [];
  if (attachments.length > 0) {
    return attachments.every((entry) => entry.category === 'image') ? 'Photo' : 'Attachment';
  }
  return item.lastMessage?.content || 'No messages yet';
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const resolveMediaSource = (publicUrl) => {
  if (!publicUrl) return '';
  if (/^https?:\/\//i.test(publicUrl)) return publicUrl;
  return `${appConfig.mediaBaseUrl}${publicUrl}`;
};

const getReactionCount = (message, value) => (message.reactions || []).filter((reaction) => reaction.value === value).length;

const getUserReaction = (message, userId) => (message.reactions || []).find((reaction) => reaction.user === userId || reaction.user?._id === userId)?.value || '';

const buildLocationMapUrl = (latitude, longitude) => `https://www.google.com/maps?q=${latitude},${longitude}`;

const LocationPreview = ({ location }) => {
  if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return null;

  const mapUrl = location.mapUrl || buildLocationMapUrl(location.latitude, location.longitude);
  const coordinateLabel = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;

  return (
    <a
      className="location-card"
      href={mapUrl}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="location-card-pin">📍</div>
      <div className="location-card-copy">
        <strong>{location.label || 'Shared location'}</strong>
        <span>{coordinateLabel}</span>
        <small>Open in Maps</small>
      </div>
    </a>
  );
};

const MediaPreview = ({ attachment }) => {
  const source = resolveMediaSource(attachment.publicUrl);
  if (attachment.category === 'image') {
    return <img src={source} alt={attachment.originalName} className="message-image" onClick={(event) => event.stopPropagation()} />;
  }

  return (
    <a className="file-chip" href={source} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
      <span>FILE</span>
      <span>{attachment.originalName}</span>
    </a>
  );
};

export default function ChatPage({ user, onLogoutComplete }) {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [connections, setConnections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [draftSticker, setDraftSticker] = useState('');
  const [draftAttachments, setDraftAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [showComposerPopup, setShowComposerPopup] = useState(false);
  const [composerPopupView, setComposerPopupView] = useState('menu');
  const [activeTab, setActiveTab] = useState('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [typingState, setTypingState] = useState({ direct: '', group: '' });
  const [groupDraft, setGroupDraft] = useState({ name: '', description: '', members: [] });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [memberIdsToAdd, setMemberIdsToAdd] = useState([]);
  const [chatError, setChatError] = useState('');
  const [editingMessageId, setEditingMessageId] = useState('');
  const [editingMessageText, setEditingMessageText] = useState('');
  const [openMessageMenuId, setOpenMessageMenuId] = useState('');
  const [callState, setCallState] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callError, setCallError] = useState('');
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const activeChatRef = useRef(activeChat);
  const callStateRef = useRef(callState);
  const incomingCallRef = useRef(incomingCall);
  const connectionsRef = useRef(connections);
  const directTypingTimeoutRef = useRef(null);
  const groupTypingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const notificationPermissionRef = useRef(false);
  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const toneIntervalRef = useRef(null);
  const toneTimeoutRef = useRef(null);
  const token = localStorage.getItem('token');

  const stopStream = (stream) => {
    stream?.getTracks().forEach((track) => track.stop());
  };

  const getAudioContext = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    return audioContextRef.current;
  };

  const clearToneTimers = () => {
    if (toneIntervalRef.current) {
      window.clearInterval(toneIntervalRef.current);
      toneIntervalRef.current = null;
    }
    if (toneTimeoutRef.current) {
      window.clearTimeout(toneTimeoutRef.current);
      toneTimeoutRef.current = null;
    }
  };

  const playBeep = (frequency, duration, startDelay = 0, gainValue = 0.04) => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startAt = audioContext.currentTime + startDelay;
    const endAt = startAt + duration;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.02);
  };

  const stopCallTone = () => {
    clearToneTimers();
  };

  const startIncomingTone = () => {
    stopCallTone();
    const ringPattern = () => {
      playBeep(880, 0.18, 0, 0.05);
      playBeep(660, 0.18, 0.26, 0.05);
    };

    ringPattern();
    toneIntervalRef.current = window.setInterval(ringPattern, 1500);
  };

  const startOutgoingTone = () => {
    stopCallTone();
    const ringbackPattern = () => {
      playBeep(425, 0.35, 0, 0.035);
      playBeep(425, 0.35, 0.45, 0.035);
    };

    ringbackPattern();
    toneIntervalRef.current = window.setInterval(ringbackPattern, 2200);
  };

  const playConnectedTone = () => {
    stopCallTone();
    playBeep(740, 0.12, 0, 0.05);
    playBeep(988, 0.14, 0.16, 0.05);
  };

  const playEndedTone = () => {
    stopCallTone();
    playBeep(540, 0.12, 0, 0.04);
    playBeep(420, 0.16, 0.14, 0.04);
  };

  const clearPeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const clearMediaSession = () => {
    clearPeerConnection();
    stopStream(localStreamRef.current);
    stopStream(remoteStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingIceCandidatesRef.current = [];
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setIsMicEnabled(true);
    setIsCameraEnabled(true);
    stopCallTone();
  };

  const refreshSidebar = async () => {
    const [chatData, connectionData, groupData, requestData] = await Promise.all([
      fetchChatList(token),
      fetchContacts(token),
      fetchGroups(token),
      fetchConnectionRequests(token)
    ]);

    setChats(chatData);
    setConnections(connectionData);
    setGroups(groupData);
    setIncomingRequests(requestData.incoming);
    setOutgoingRequests(requestData.outgoing);
  };

  const updateSearchStatus = (userId, connectionStatus) => {
    setSearchResults((prev) => prev.map((entry) => (entry._id === userId ? { ...entry, connectionStatus } : entry)));
  };

  const showSystemNotification = (title, body, options = {}) => {
    if (document.hasFocus() || !notificationPermissionRef.current) return;

    const notification = new Notification(title, {
      body,
      tag: options.tag,
      renotify: Boolean(options.tag),
      silent: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  const notifyForMessage = (title, body) => {
    showSystemNotification(title, body, { tag: 'message' });
  };

  const ensurePushNotificationsEnabled = async () => {
    if (!token || !appConfig.vapidPublicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(appConfig.vapidPublicKey)
        });
      }

      await subscribeToPush(subscription.toJSON ? subscription.toJSON() : subscription, token);
    } catch (error) {
      console.error('Unable to enable push notifications:', error);
    }
  };

  const clearComposerExtras = () => {
    setDraftSticker('');
    setDraftAttachments([]);
  };

  const replaceMessageInState = (updatedMessage) => {
    setMessages((prev) => prev.map((entry) => (entry._id === updatedMessage._id ? updatedMessage : entry)));
    upsertChatItem(updatedMessage, Boolean(updatedMessage.group));
  };

  const beginEditMessage = (messageToEdit) => {
    setEditingMessageId(messageToEdit._id);
    setEditingMessageText(messageToEdit.content || '');
    setOpenMessageMenuId('');
  };

  const cancelEditMessage = () => {
    setEditingMessageId('');
    setEditingMessageText('');
  };

  const submitEditMessage = () => {
    if (!socket || !editingMessageId) return;
    socket.emit('edit-message', { messageId: editingMessageId, content: editingMessageText });
    cancelEditMessage();
  };

  const handleDeleteMessage = (messageId) => {
    if (!socket) return;
    socket.emit('delete-message', { messageId });
    setOpenMessageMenuId('');
    if (editingMessageId === messageId) {
      cancelEditMessage();
    }
  };

  const handleReactionToggle = (messageId, value) => {
    if (!socket) return;
    socket.emit('toggle-message-reaction', { messageId, value });
    setOpenMessageMenuId('');
  };

  const handleShareLocation = () => {
    if (!socket || !activeChat) return;
    if (!navigator.geolocation) {
      setChatError('Location sharing is not supported in this browser.');
      return;
    }

    setChatError('');
    setSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        const location = {
          latitude,
          longitude,
          label: 'Current location',
          mapUrl: buildLocationMapUrl(latitude, longitude)
        };
        const tempId = `location-${Date.now()}`;

        if (activeChat.group) {
          socket.emit('group-message', { groupId: activeChat._id, tempId, location, content: '' });
        } else {
          socket.emit('personal-message', { recipientId: activeChat._id, tempId, location, content: '' });
        }

        setSharingLocation(false);
        setShowComposerPopup(false);
        setComposerPopupView('menu');
      },
      (error) => {
        const locationError = error.code === 1 ? 'Location permission was denied.' : 'Unable to get your current location.';
        setChatError(locationError);
        setSharingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  };

  const upsertChatItem = (messagePayload, isGroup) => {
    if (isGroup) {
      setChats((prev) => prev.map((chat) => (chat._id === messagePayload.group ? { ...chat, lastMessage: messagePayload } : chat)));
      setGroups((prev) => prev.map((group) => (group._id === messagePayload.group ? { ...group, lastMessage: messagePayload } : group)));
      return;
    }

    const partnerId = messagePayload.sender._id === user._id ? messagePayload.recipient : messagePayload.sender._id;
    setChats((prev) => {
      const existing = prev.find((entry) => entry._id === partnerId);
      if (existing) {
        const updated = { ...existing, lastMessage: messagePayload };
        return [updated, ...prev.filter((entry) => entry._id !== partnerId)];
      }

      const fallback = connectionsRef.current.find((entry) => entry._id === partnerId);
      if (!fallback) return prev;
      return [{ ...fallback, lastMessage: messagePayload }, ...prev];
    });
  };

  const markMessagesRead = (loadedMessages, chat) => {
    if (!socket) return;

    if (chat.group) {
      const unreadIds = loadedMessages
        .filter((msg) => msg.sender._id !== user._id && !msg.readBy?.includes(user._id))
        .map((msg) => msg._id);

      if (unreadIds.length > 0) {
        socket.emit('mark-group-messages-read', { groupId: chat._id, messageIds: unreadIds });
      }
      return;
    }

    const unreadIds = loadedMessages
      .filter((msg) => msg.sender._id !== user._id && msg.status !== 'read')
      .map((msg) => msg._id);

    if (unreadIds.length > 0) {
      socket.emit('mark-as-read', { senderId: chat._id, messageIds: unreadIds });
      setMessages((prev) => prev.map((entry) => (unreadIds.includes(entry._id) ? { ...entry, status: 'read' } : entry)));
    }
  };

  const loadConversation = async (chat) => {
    const resolvedChat = chat.group ? groups.find((entry) => entry._id === chat._id) || chat : chat;
    setChatError('');
    clearComposerExtras();
    cancelEditMessage();
    setOpenMessageMenuId('');

    if (activeChatRef.current?.group && activeChatRef.current._id !== resolvedChat._id) {
      socket?.emit('leave-group', activeChatRef.current._id);
    }

    setActiveChat(resolvedChat);

    try {
      const loadedMessages = resolvedChat.group
        ? await fetchGroupMessages(resolvedChat._id, token)
        : await fetchMessages(resolvedChat._id, token);

      setMessages(loadedMessages);

      if (resolvedChat.group) {
        socket?.emit('join-group', resolvedChat._id);
      }

      markMessagesRead(loadedMessages, resolvedChat);
    } catch (error) {
      setMessages([]);
      setChatError(error.response?.data?.error || 'Unable to load chat.');
    }
  };

  const syncVideoElements = () => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current || null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current || null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current || null;
    }
  };

  const flushPendingCandidates = async () => {
    if (!peerConnectionRef.current || !peerConnectionRef.current.remoteDescription) return;

    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Failed to add buffered ICE candidate:', error);
      }
    }
  };

  const ensureLocalStream = async (type) => {
    if (localStreamRef.current) return localStreamRef.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Your browser does not support voice or video calling.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video'
    });
    localStreamRef.current = stream;
    remoteStreamRef.current = new MediaStream();
    syncVideoElements();
    setIsMicEnabled(true);
    setIsCameraEnabled(type === 'video');
    return stream;
  };

  const createPeerConnection = (recipientId, callId) => {
    clearPeerConnection();

    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = peerConnection;

    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream();
    }

    peerConnection.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!remoteStreamRef.current.getTracks().some((entry) => entry.id === track.id)) {
          remoteStreamRef.current.addTrack(track);
        }
      });
      syncVideoElements();
      playConnectedTone();
      setCallState((prev) => (prev && prev.callId === callId ? { ...prev, phase: 'connected' } : prev));
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          recipientId,
          callId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const connectionState = peerConnection.connectionState;
      if (connectionState === 'failed' || connectionState === 'disconnected' || connectionState === 'closed') {
        clearMediaSession();
        setCallState(null);
      }
    };

    localStreamRef.current?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current);
    });

    return peerConnection;
  };

  const handleIncomingIceCandidate = async ({ callId, candidate }) => {
    if (!candidate) return;

    if (!peerConnectionRef.current) {
      pendingIceCandidatesRef.current.push(candidate);
      return;
    }

    const matchesKnownCall = callStateRef.current?.callId === callId || incomingCallRef.current?.callId === callId;
    if (!matchesKnownCall) return;

    if (!peerConnectionRef.current.remoteDescription) {
      pendingIceCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Unable to add ICE candidate:', error);
    }
  };

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        notificationPermissionRef.current = permission === 'granted';
        if (permission === 'granted') {
          ensurePushNotificationsEnabled();
        }
      });
    }
  }, [token]);

  useEffect(() => {
    const socketClient = io(appConfig.socketUrl, { auth: { token } });

    socketClient.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message || err);
    });

    socketClient.on('message-updated', (updatedMessage) => {
      replaceMessageInState(updatedMessage);
    });

    socketClient.on('message-deleted', (updatedMessage) => {
      replaceMessageInState(updatedMessage);
    });

    socketClient.on('message-reaction-updated', (updatedMessage) => {
      replaceMessageInState(updatedMessage);
    });

    socketClient.on('user-status', ({ userId, online, lastSeen }) => {
      setConnections((prev) => prev.map((entry) => (entry._id === userId ? { ...entry, online, lastSeen } : entry)));
      setChats((prev) => prev.map((entry) => (entry._id === userId ? { ...entry, online, lastSeen } : entry)));
      setSearchResults((prev) => prev.map((entry) => (entry._id === userId ? { ...entry, online, lastSeen } : entry)));
      setIncomingRequests((prev) => prev.map((entry) => (entry._id === userId ? { ...entry, online, lastSeen } : entry)));
      setOutgoingRequests((prev) => prev.map((entry) => (entry._id === userId ? { ...entry, online, lastSeen } : entry)));

      if (activeChatRef.current && activeChatRef.current._id === userId) {
        setActiveChat((prev) => (prev ? { ...prev, online, lastSeen } : prev));
      }
    });

    socketClient.on('new-message', (incomingMessage) => {
      const isCurrentChat = activeChatRef.current && !activeChatRef.current.group && activeChatRef.current._id === incomingMessage.sender._id;
      if (isCurrentChat) {
        setMessages((prev) => [...prev, incomingMessage]);
        socketClient.emit('mark-as-read', { senderId: incomingMessage.sender._id, messageIds: [incomingMessage._id] });
      } else {
        notifyForMessage(incomingMessage.sender.username, incomingMessage.content || incomingMessage.sticker || 'New attachment');
      }

      upsertChatItem(incomingMessage, false);
    });

    socketClient.on('new-group-message', (incomingMessage) => {
      const isCurrentGroup = activeChatRef.current && activeChatRef.current.group && activeChatRef.current._id === incomingMessage.group;
      if (isCurrentGroup) {
        setMessages((prev) => [...prev, incomingMessage]);
      } else {
        notifyForMessage('Group message', incomingMessage.content || incomingMessage.sticker || 'New attachment');
      }

      upsertChatItem(incomingMessage, true);
    });

    socketClient.on('call-history', (historyMessage) => {
      const activeDirectChatId = activeChatRef.current && !activeChatRef.current.group ? activeChatRef.current._id : null;
      const participants = [historyMessage.sender?._id, historyMessage.recipient].filter(Boolean);
      if (activeDirectChatId && participants.includes(activeDirectChatId)) {
        setMessages((prev) => [...prev, historyMessage]);
      }

      upsertChatItem(historyMessage, false);
    });

    socketClient.on('message-sent', ({ tempId, messageId, message: confirmedMessage }) => {
      setMessages((prev) =>
        prev.map((entry) =>
          entry._id === tempId ? { ...confirmedMessage, _id: messageId, status: confirmedMessage.status || 'sent' } : entry
        )
      );
      upsertChatItem(confirmedMessage, Boolean(confirmedMessage.group));
    });

    socketClient.on('message-delivered', ({ messageId }) => {
      setMessages((prev) => prev.map((entry) => (entry._id === messageId ? { ...entry, status: 'delivered' } : entry)));
    });

    socketClient.on('messages-read', ({ messageIds }) => {
      setMessages((prev) => prev.map((entry) => (messageIds.includes(entry._id) ? { ...entry, status: 'read' } : entry)));
    });

    socketClient.on('group-messages-read', ({ messageIds, readerId }) => {
      setMessages((prev) =>
        prev.map((entry) =>
          messageIds.includes(entry._id) ? { ...entry, readBy: [...new Set([...(entry.readBy || []), readerId])] } : entry
        )
      );
    });

    socketClient.on('typing', ({ senderId, isTyping, senderName }) => {
      if (!activeChatRef.current || activeChatRef.current.group || activeChatRef.current._id !== senderId) return;
      setTypingState((prev) => ({ ...prev, direct: isTyping ? `${senderName || 'Someone'} is typing...` : '' }));
    });

    socketClient.on('group-typing', ({ groupId, isTyping, senderName }) => {
      if (!activeChatRef.current || !activeChatRef.current.group || activeChatRef.current._id !== groupId) return;
      setTypingState((prev) => ({ ...prev, group: isTyping ? `${senderName || 'Someone'} is typing...` : '' }));
    });

    socketClient.on('message-error', ({ tempId, error }) => {
      setMessages((prev) => prev.filter((entry) => entry._id !== tempId));
      setChatError(error);
    });

    socketClient.on('call-request', (payload) => {
      setCallError('');
      startIncomingTone();
      showSystemNotification(
        `${payload.caller.username} is calling`,
        `${payload.type === 'video' ? 'Video' : 'Voice'} call incoming`,
        { tag: `call-${payload.callId}` }
      );
      setIncomingCall(payload);
    });

    socketClient.on('call-answer', async ({ callId, answer }) => {
      if (!peerConnectionRef.current || callStateRef.current?.callId !== callId || !answer) return;

      try {
        const normalizedAnswer = toSessionDescriptionPayload(answer);
        if (!normalizedAnswer) {
          throw new Error('Invalid call answer payload');
        }

        stopCallTone();
        await peerConnectionRef.current.setRemoteDescription(normalizedAnswer);
        await flushPendingCandidates();
        setCallState((prev) => (prev && prev.callId === callId ? { ...prev, phase: 'connecting' } : prev));
      } catch (error) {
        console.error('Unable to apply remote answer:', error);
        setCallError('Unable to connect the call. Please refresh both users and try again.');
        clearMediaSession();
        setCallState(null);
      }
    });

    socketClient.on('ice-candidate', async ({ callId, candidate }) => {
      const matchesActiveCall = callStateRef.current?.callId === callId || incomingCallRef.current?.callId === callId;
      if (!matchesActiveCall) return;
      await handleIncomingIceCandidate({ callId, candidate });
    });

    socketClient.on('call-rejected', ({ callId }) => {
      playEndedTone();
      clearMediaSession();
      setCallState((prev) => (prev && prev.callId === callId ? null : prev));
      alert('Call was rejected.');
    });

    socketClient.on('call-ended', ({ callId }) => {
      playEndedTone();
      clearMediaSession();
      setCallState((prev) => (prev && prev.callId === callId ? null : prev));
      setIncomingCall((prev) => (prev && prev.callId === callId ? null : prev));
    });

    setSocket(socketClient);

    return () => {
      clearMediaSession();
      socketClient.disconnect();
    };
  }, [token, user._id, user.username]);

  useEffect(() => {
    refreshSidebar();
  }, []);

  useEffect(() => {
    syncVideoElements();
  }, [callState, incomingCall]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingState, draftAttachments]);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchUsers(searchTerm.trim(), token);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, token]);

  const handleAttachmentSelection = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setUploading(true);
    setChatError('');

    try {
      const uploadedFiles = [];
      for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        const uploaded = await uploadChatMedia(
          {
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            dataUrl
          },
          token
        );
        uploadedFiles.push(uploaded);
      }

      setDraftAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      setChatError(error.response?.data?.error || error.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendTypingEvent = (nextValue) => {
    setMessage(nextValue);
    if (!activeChat || !socket) return;

    if (activeChat.group) {
      socket.emit('group-typing', { groupId: activeChat._id, isTyping: true });
      clearTimeout(groupTypingTimeoutRef.current);
      groupTypingTimeoutRef.current = setTimeout(() => {
        socket.emit('group-typing', { groupId: activeChat._id, isTyping: false });
      }, 1200);
      return;
    }

    socket.emit('typing', { recipientId: activeChat._id, isTyping: true });
    clearTimeout(directTypingTimeoutRef.current);
    directTypingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { recipientId: activeChat._id, isTyping: false });
    }, 1200);
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if ((!trimmedMessage && !draftSticker && draftAttachments.length === 0) || !activeChat || !socket || uploading) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: user._id, username: user.username, avatar: user.avatar },
      recipient: activeChat.group ? undefined : activeChat._id,
      group: activeChat.group ? activeChat._id : undefined,
      content: trimmedMessage,
      sticker: draftSticker,
      attachments: draftAttachments,
      timestamp: new Date().toISOString(),
      status: 'sent',
      readBy: []
    };

    setChatError('');
    setMessages((prev) => [...prev, optimisticMessage]);

    const payload = {
      tempId,
      content: trimmedMessage,
      sticker: draftSticker,
      attachmentIds: draftAttachments.map((entry) => entry._id)
    };

    if (activeChat.group) {
      socket.emit('group-message', { ...payload, groupId: activeChat._id });
    } else {
      socket.emit('personal-message', { ...payload, recipientId: activeChat._id });
    }

    setMessage('');
    clearComposerExtras();
    setShowComposerPopup(false);
    setComposerPopupView('menu');
  };

  const handleConnectionRequest = async (targetUser) => {
    try {
      await sendConnectionRequest(targetUser._id, token);
      setOutgoingRequests((prev) => [...prev.filter((entry) => entry._id !== targetUser._id), { ...targetUser, connectionStatus: 'outgoing' }]);
      setIncomingRequests((prev) => prev.filter((entry) => entry._id !== targetUser._id));
      updateSearchStatus(targetUser._id, 'outgoing');
      await refreshSidebar();
    } catch (error) {
      console.error('Unable to send request:', error);
    }
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const response = await sendInviteEmail(inviteEmail.trim(), token);
      setInviteStatus(response.message || 'Invite sent');
      setInviteEmail('');
    } catch (error) {
      setInviteStatus(error.response?.data?.error || 'Unable to send invite');
    }
  };

  const handleLogout = async () => {
    const currentToken = localStorage.getItem('token');

    try {
      if (currentToken) {
        await logoutUser(currentToken);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      socket?.disconnect();
      localStorage.removeItem('token');
      if (onLogoutComplete) {
        onLogoutComplete();
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  const handleAcceptRequest = async (targetUser) => {
    try {
      await acceptConnectionRequest(targetUser._id, token);
      setIncomingRequests((prev) => prev.filter((entry) => entry._id !== targetUser._id));
      setOutgoingRequests((prev) => prev.filter((entry) => entry._id !== targetUser._id));
      setConnections((prev) => [...prev.filter((entry) => entry._id !== targetUser._id), { ...targetUser, connectionStatus: 'connected' }]);
      updateSearchStatus(targetUser._id, 'connected');
      await refreshSidebar();
    } catch (error) {
      console.error('Unable to accept request:', error);
    }
  };

  const handleRejectRequest = async (targetUser) => {
    try {
      await rejectConnectionRequest(targetUser._id, token);
      setIncomingRequests((prev) => prev.filter((entry) => entry._id !== targetUser._id));
      setOutgoingRequests((prev) => prev.filter((entry) => entry._id !== targetUser._id));
      updateSearchStatus(targetUser._id, 'none');
      await refreshSidebar();
    } catch (error) {
      console.error('Unable to reject request:', error);
    }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    if (!groupDraft.name.trim() || groupDraft.members.length === 0) {
      setGroupError('Choose a group name and at least one connected member.');
      return;
    }

    try {
      const group = await createGroup(
        {
          name: groupDraft.name.trim(),
          description: groupDraft.description.trim(),
          members: groupDraft.members
        },
        token
      );

      setGroups((prev) => [group, ...prev]);
      setChats((prev) => [group, ...prev]);
      setShowCreateGroup(false);
      setGroupDraft({ name: '', description: '', members: [] });
      setGroupError('');
      setActiveTab('groups');
    } catch (error) {
      setGroupError(error.response?.data?.error || 'Unable to create group.');
    }
  };

  const handleAddMembers = async () => {
    if (!activeChat?.group || memberIdsToAdd.length === 0) return;

    try {
      const updatedGroup = await addGroupMembers(activeChat._id, memberIdsToAdd, token);
      setGroups((prev) => prev.map((entry) => (entry._id === updatedGroup._id ? { ...entry, ...updatedGroup } : entry)));
      setActiveChat((prev) => (prev ? { ...prev, ...updatedGroup } : prev));
      setMemberIdsToAdd([]);
    } catch (error) {
      console.error('Unable to add members:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeChat?.group) return;

    try {
      await leaveGroup(activeChat._id, token);
      socket?.emit('leave-group', activeChat._id);
      setGroups((prev) => prev.filter((entry) => entry._id !== activeChat._id));
      setChats((prev) => prev.filter((entry) => entry._id !== activeChat._id));
      setActiveChat(null);
      setMessages([]);
    } catch (error) {
      console.error('Unable to leave group:', error);
    }
  };

  const startCall = async (type) => {
    if (!socket || !activeChat || activeChat.group) return;

    try {
      setCallError('');
      const callId = `call-${Date.now()}`;
      await ensureLocalStream(type);
      const peerConnection = createPeerConnection(activeChat._id, callId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      const serializedOffer = toSessionDescriptionPayload(peerConnection.localDescription);
      if (!serializedOffer) {
        throw new Error('Unable to create a valid call offer.');
      }

      const nextCall = {
        callId,
        recipientId: activeChat._id,
        recipientName: activeChat.username,
        type,
        phase: 'ringing'
      };

      setCallState(nextCall);
      startOutgoingTone();
      socket.emit('call-request', {
        ...nextCall,
        offer: serializedOffer
      });
    } catch (error) {
      console.error('Unable to start call:', error);
      setCallError(error.message || 'Unable to start the call.');
      clearMediaSession();
      setCallState(null);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !socket || !incomingCall.offer) return;

    try {
      setCallError('');
      await ensureLocalStream(incomingCall.type);
      const peerConnection = createPeerConnection(incomingCall.caller._id, incomingCall.callId);
      const normalizedOffer = toSessionDescriptionPayload(incomingCall.offer);
      if (!normalizedOffer) {
        throw new Error('Incoming call offer is invalid.');
      }

      await peerConnection.setRemoteDescription(normalizedOffer);
      await flushPendingCandidates();
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      const serializedAnswer = toSessionDescriptionPayload(peerConnection.localDescription);
      if (!serializedAnswer) {
        throw new Error('Unable to create a valid call answer.');
      }

      socket.emit('call-answer', {
        recipientId: incomingCall.caller._id,
        callId: incomingCall.callId,
        answer: serializedAnswer
      });

      stopCallTone();
      setCallState({
        callId: incomingCall.callId,
        recipientId: incomingCall.caller._id,
        recipientName: incomingCall.caller.username,
        type: incomingCall.type,
        phase: 'connecting'
      });
      setIncomingCall(null);
    } catch (error) {
      console.error('Unable to answer call:', error);
      setCallError(error.message || 'Unable to answer the call.');
      clearMediaSession();
      setCallState(null);
    }
  };

  const rejectCall = () => {
    if (!incomingCall || !socket) return;

    socket.emit('call-rejected', {
      recipientId: incomingCall.caller._id,
      callId: incomingCall.callId
    });

    stopCallTone();
    setIncomingCall(null);
  };

  const endCall = () => {
    if (!callState || !socket) return;

    socket.emit('call-ended', {
      recipientId: callState.recipientId,
      callId: callState.callId
    });

    playEndedTone();
    clearMediaSession();
    setCallState(null);
  };

  const toggleMicrophone = () => {
    const nextValue = !isMicEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextValue;
    });
    setIsMicEnabled(nextValue);
  };

  const toggleCamera = () => {
    const nextValue = !isCameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextValue;
    });
    setIsCameraEnabled(nextValue);
  };

  const availableConnections = useMemo(
    () => connections.filter((entry) => !groupDraft.members.includes(entry._id)),
    [connections, groupDraft.members]
  );

  const availableMembersToAdd = useMemo(() => {
    if (!activeChat?.group) return [];
    const existingMemberIds = new Set((activeChat.members || []).map((member) => member._id || member));
    return connections.filter((entry) => !existingMemberIds.has(entry._id));
  }, [activeChat, connections]);

  const currentList = useMemo(() => {
    if (activeTab === 'chats') return chats;
    if (activeTab === 'groups') return groups;
    return connections;
  }, [activeTab, chats, groups, connections]);

  const renderSearchAction = (entry) => {
    if (entry.connectionStatus === 'connected') {
      return <span className="status-label connected">Open Chat</span>;
    }
    if (entry.connectionStatus === 'outgoing') {
      return <span className="status-label pending">Request Sent</span>;
    }
    if (entry.connectionStatus === 'incoming') {
      return (
        <div className="inline-actions">
          <button
            className="ghost-button"
            onClick={(event) => {
              event.stopPropagation();
              handleAcceptRequest(entry);
            }}
          >
            Accept
          </button>
          <button
            className="danger-button"
            onClick={(event) => {
              event.stopPropagation();
              handleRejectRequest(entry);
            }}
          >
            Reject
          </button>
        </div>
      );
    }

    return (
      <button
        className="ghost-button"
        onClick={(event) => {
          event.stopPropagation();
          handleConnectionRequest(entry);
        }}
      >
        Connect
      </button>
    );
  };

  return (
    <div className="chat-shell">
      <header className="app-navbar">
        <div className="app-navbar-brand">
          <img src="/assets/images/Strangers_Play_logo.png" alt="Strangers Play" className="app-navbar-logo" />
          <div>
            <strong>Strangers Play</strong>
            <span>Connect, chat, share</span>
          </div>
        </div>
        <div className="app-navbar-search">
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search username or email..." />
          {searchTerm.trim().length >= 2 && (
            <div className="navbar-search-results">
              {searchResults.map((entry) => (
                <div
                  key={entry._id}
                  className={`request-card ${entry.connectionStatus === 'connected' ? 'request-card-clickable' : ''}`}
                  onClick={() => {
                    if (entry.connectionStatus === 'connected') {
                      loadConversation(entry);
                    }
                  }}
                >
                  <div>
                    <strong>{entry.username}</strong>
                    <small>{entry.email}</small>
                  </div>
                  {renderSearchAction(entry)}
                </div>
              ))}
              {searchResults.length === 0 && <div className="empty-state slim">No matching people found.</div>}
            </div>
          )}
        </div>
        <div className="app-navbar-actions">
          <button className="ghost-button" onClick={() => setShowInvitePanel((prev) => !prev)}>
            Invite Friends
          </button>
          <button className="ghost-button" onClick={() => setShowCreateGroup((prev) => !prev)}>
            New Group
          </button>
          <button className="ghost-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <aside className="sidebar">
        <div className="sidebar-header sidebar-profile-card">
          <div className="sidebar-user-row">
            <div className="sidebar-avatar">{getInitials(user.username)}</div>
            <div className="sidebar-user">
              <strong>{user.username}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <div className="sidebar-profile-meta">
            <span>Community ready</span>
            <span>{connections.length} connections</span>
          </div>
        </div>

        <div className="sidebar-tabs sidebar-section">
          {[
            { id: 'chats', label: 'Chats' },
            { id: 'groups', label: 'Groups' },
            { id: 'connections', label: 'Connections' }
          ].map((tab) => (
            <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {showCreateGroup && (
          <form className="group-panel sidebar-inline-panel" onSubmit={handleCreateGroup}>
            <h3>Create group</h3>
            {groupError && <div className="auth-error">{groupError}</div>}
            <input
              value={groupDraft.name}
              onChange={(e) => setGroupDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Group name"
            />
            <input
              value={groupDraft.description}
              onChange={(e) => setGroupDraft((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
            />
            <div className="contact-picker">
              {availableConnections.map((entry) => (
                <label key={entry._id} className="picker-option">
                  <input
                    type="checkbox"
                    checked={groupDraft.members.includes(entry._id)}
                    onChange={() =>
                      setGroupDraft((prev) => ({
                        ...prev,
                        members: prev.members.includes(entry._id)
                          ? prev.members.filter((id) => id !== entry._id)
                          : [...prev.members, entry._id]
                      }))
                    }
                  />
                  <span>{entry.username}</span>
                </label>
              ))}
            </div>
            <button type="submit">Create</button>
          </form>
        )}

        {activeTab === 'connections' && (
          <div className="request-sections sidebar-section">
            <div className="request-section">
              <h3>Incoming Requests</h3>
              {incomingRequests.map((entry) => (
                <div key={entry._id} className="request-card">
                  <div>
                    <strong>{entry.username}</strong>
                    <small>{entry.email}</small>
                  </div>
                  <div className="inline-actions">
                    <button className="ghost-button" onClick={() => handleAcceptRequest(entry)}>Accept</button>
                    <button className="danger-button" onClick={() => handleRejectRequest(entry)}>Reject</button>
                  </div>
                </div>
              ))}
              {incomingRequests.length === 0 && <div className="empty-state slim">No incoming requests.</div>}
            </div>
            <div className="request-section">
              <h3>Outgoing Requests</h3>
              {outgoingRequests.map((entry) => (
                <div key={entry._id} className="request-card">
                  <div>
                    <strong>{entry.username}</strong>
                    <small>{entry.email}</small>
                  </div>
                  <span className="status-label pending">Pending</span>
                </div>
              ))}
              {outgoingRequests.length === 0 && <div className="empty-state slim">No outgoing requests.</div>}
            </div>
          </div>
        )}

        <div className="chat-list">
          {currentList.map((item) => (
            <div key={item._id} className={`chat-item ${activeChat?._id === item._id ? 'selected' : ''}`} onClick={() => loadConversation(item)}>
              <div className="chat-item-top">
                <strong>{item.name || item.username}</strong>
                <small>{formatTime(item.lastMessage?.timestamp)}</small>
              </div>
              <div className="chat-item-bottom">
                <small>{activeTab === 'connections' ? item.email : buildChatPreview(item)}</small>
                {!item.group && <span className={`status-dot ${item.online ? 'online' : 'offline'}`} />}
              </div>
            </div>
          ))}
          {currentList.length === 0 && <div className="empty-state">Nothing to show yet.</div>}
        </div>
      </aside>

      <main className="chat-view">
        {activeChat ? (
          <>
            <div className="chat-header">
              <div>
                <h2>{activeChat.name || activeChat.username}</h2>
                <p>{activeChat.group ? `${activeChat.members?.length || 0} members` : activeChat.online ? 'Online' : formatLastSeen(activeChat.lastSeen)}</p>
              </div>
              <div className="chat-actions">
                {!activeChat.group && (
                  <>
                    <button className="ghost-button icon-button" onClick={() => startCall('voice')} title="Voice call" aria-label="Voice call">
                      📞
                    </button>
                    <button className="ghost-button icon-button" onClick={() => startCall('video')} title="Video call" aria-label="Video call">
                      🎥
                    </button>
                  </>
                )}
                {callState && <button className="danger-button" onClick={endCall}>End Call</button>}
              </div>
            </div>

            {callError && <div className="chat-error-banner">{callError}</div>}

            {activeChat.group && (
              <div className="group-panel inline">
                <div className="group-members">
                  {(activeChat.members || []).map((member) => (
                    <span key={member._id || member} className="member-pill">
                      {member.username || 'Member'}
                    </span>
                  ))}
                </div>
                {availableMembersToAdd.length > 0 && (
                  <>
                    <div className="contact-picker compact">
                      {availableMembersToAdd.map((entry) => (
                        <label key={entry._id} className="picker-option">
                          <input
                            type="checkbox"
                            checked={memberIdsToAdd.includes(entry._id)}
                            onChange={() =>
                              setMemberIdsToAdd((prev) =>
                                prev.includes(entry._id) ? prev.filter((id) => id !== entry._id) : [...prev, entry._id]
                              )
                            }
                          />
                          <span>{entry.username}</span>
                        </label>
                      ))}
                    </div>
                    <button className="ghost-button" onClick={handleAddMembers}>Add Members</button>
                  </>
                )}
                <div className="group-actions">
                  <button className="danger-button" onClick={handleLeaveGroup}>Leave Group</button>
                </div>
              </div>
            )}

            <div className="messages-area">
              {chatError && <div className="chat-error-banner">{chatError}</div>}
              {messages.map((msg) => {
                const isOwnMessage = msg.sender._id === user._id;
                const callLabel = msg.callDetails
                  ? `${msg.callDetails.mode === 'video' ? 'Video' : 'Voice'} call ${msg.callDetails.status}`
                  : 'Call activity';
                const canEditMessage = isOwnMessage && !msg.isDeleted && msg.type !== 'call' && msg.type !== 'location' && !msg.location;
                const likeCount = getReactionCount(msg, 'like');
                const dislikeCount = getReactionCount(msg, 'dislike');
                const currentReaction = getUserReaction(msg, user._id);
                const canOpenMessageMenu = msg.type !== 'call' && !msg.isDeleted;
                return (
                  <div
                    key={msg._id || msg.timestamp}
                    className={`${isOwnMessage ? 'message sent' : 'message received'} ${canOpenMessageMenu ? 'message-menu-enabled' : ''}`}
                    onClick={() => {
                      if (!canOpenMessageMenu || editingMessageId === msg._id) return;
                      setOpenMessageMenuId((prev) => (prev === msg._id ? '' : msg._id));
                    }}
                  >
                    {activeChat.group && !isOwnMessage && <div className="message-author">{msg.sender.username}</div>}
                    {msg.type === 'call' ? (
                      <div className="call-history-card">
                        <strong>{callLabel}</strong>
                        {msg.callDetails?.durationSeconds > 0 && <span>Duration {msg.callDetails.durationSeconds}s</span>}
                      </div>
                    ) : msg.isDeleted ? (
                      <div className="message-deleted-label">This message was deleted.</div>
                    ) : editingMessageId === msg._id ? (
                      <div className="message-edit-panel">
                        <input
                          value={editingMessageText}
                          onChange={(event) => setEditingMessageText(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') submitEditMessage();
                            if (event.key === 'Escape') cancelEditMessage();
                          }}
                          placeholder="Edit message"
                        />
                        <div className="message-inline-actions">
                          <button className="ghost-button message-action-button" onClick={submitEditMessage}>
                            Save
                          </button>
                          <button className="ghost-button message-action-button" onClick={cancelEditMessage}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.location && <LocationPreview location={msg.location} />}
                        {msg.sticker && <div className="sticker-bubble">{msg.sticker}</div>}
                        {msg.content && <div>{msg.content}</div>}
                        {msg.attachments?.length > 0 && (
                          <div className="media-grid">
                            {msg.attachments.map((attachment) => (
                              <MediaPreview key={attachment._id} attachment={attachment} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {(likeCount > 0 || dislikeCount > 0) && !msg.isDeleted && msg.type !== 'call' && (
                      <div className="message-reaction-summary">
                        {likeCount > 0 && <span className={currentReaction === 'like' ? 'active' : ''}>👍 {likeCount}</span>}
                        {dislikeCount > 0 && <span className={currentReaction === 'dislike' ? 'active' : ''}>👎 {dislikeCount}</span>}
                      </div>
                    )}
                    {openMessageMenuId === msg._id && canOpenMessageMenu && (
                      <div className="message-inline-menu" onClick={(event) => event.stopPropagation()}>
                        {canEditMessage && (
                          <>
                            <button className="message-menu-item" onClick={() => beginEditMessage(msg)}>
                              <span className="message-menu-item-icon">✏️</span>
                              <span>Edit</span>
                            </button>
                            <button className="message-menu-item delete" onClick={() => handleDeleteMessage(msg._id)}>
                              <span className="message-menu-item-icon">🗑️</span>
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                        {!msg.isDeleted && (
                          <>
                            <button className="message-menu-item" onClick={() => handleReactionToggle(msg._id, 'like')}>
                              <span className="message-menu-item-icon">👍</span>
                              <span>{currentReaction === 'like' ? 'Remove Like' : 'Like'}</span>
                            </button>
                            <button className="message-menu-item" onClick={() => handleReactionToggle(msg._id, 'dislike')}>
                              <span className="message-menu-item-icon">👎</span>
                              <span>{currentReaction === 'dislike' ? 'Remove Dislike' : 'Dislike'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <div className="message-meta">
                      <small>{formatTime(msg.timestamp)}</small>
                      {msg.editedAt && <small>Edited</small>}
                      {isOwnMessage && <span className={`message-status ${msg.status || 'sent'}`}>{msg.status || 'sent'}</span>}
                    </div>
                  </div>
                );
              })}
              {(typingState.direct || typingState.group) && <div className="typing-indicator">{typingState.direct || typingState.group}</div>}
              <div ref={messageEndRef} />
            </div>

            {draftAttachments.length > 0 && (
              <div className="draft-strip">
                {draftAttachments.map((attachment) => (
                  <div key={attachment._id} className="draft-card">
                    <MediaPreview attachment={attachment} />
                    <button className="draft-remove" onClick={() => setDraftAttachments((prev) => prev.filter((entry) => entry._id !== attachment._id))}>
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            {draftSticker && (
              <div className="draft-sticker">
                <span>{draftSticker}</span>
                <button className="draft-remove" onClick={() => setDraftSticker('')}>x</button>
              </div>
            )}

            <div className="composer-toolbar">
              <div className="picker-anchor">
                <button
                  className="ghost-button composer-launcher"
                  onClick={() => {
                    setComposerPopupView('menu');
                    setShowComposerPopup((prev) => !prev);
                  }}
                  title="Open attachments, emoji, and stickers"
                  aria-label="Open attachments, emoji, and stickers"
                >
                  <span>+</span>
                  <small>Attach</small>
                </button>
                {showComposerPopup && (
                  <div className="picker-popup">
                    <div className="picker-popup-header">
                      <strong>{composerPopupView === 'menu' ? 'Chat Tools' : 'Emoji & Stickers'}</strong>
                      <button
                        className="picker-popup-close"
                        onClick={() => {
                          setShowComposerPopup(false);
                          setComposerPopupView('menu');
                        }}
                      >
                        x
                      </button>
                    </div>
                    {composerPopupView === 'menu' ? (
                      <div className="picker-action-grid">
                        <button
                          className="picker-action-tile"
                          onClick={() => {
                            setComposerPopupView('emoji');
                          }}
                        >
                          <span>😀</span>
                          <small>Emoji</small>
                        </button>
                        <button
                          className="picker-action-tile"
                          onClick={() => {
                            setShowComposerPopup(false);
                            setComposerPopupView('menu');
                            fileInputRef.current?.click();
                          }}
                        >
                          <span>📎</span>
                          <small>Attachment</small>
                        </button>
                        <button
                          className="picker-action-tile"
                          onClick={() => {
                            setShowComposerPopup(false);
                            setComposerPopupView('menu');
                            photoInputRef.current?.click();
                          }}
                        >
                          <span>🖼️</span>
                          <small>Photo</small>
                        </button>
                        <button
                          className="picker-action-tile"
                          onClick={handleShareLocation}
                          disabled={sharingLocation}
                        >
                          <span>📍</span>
                          <small>{sharingLocation ? 'Sharing...' : 'Location'}</small>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="picker-popup-section">
                          <strong>Emojis</strong>
                        </div>
                        <div className="picker-panel">
                          {emojiSet.map((emoji) => (
                            <button
                              key={emoji}
                              className="picker-chip"
                              onClick={() => {
                                setMessage((prev) => `${prev}${emoji}`);
                                setShowComposerPopup(false);
                                setComposerPopupView('menu');
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <div className="picker-popup-section">
                          <strong>Stickers</strong>
                        </div>
                        <div className="picker-panel">
                          {stickerSet.map((sticker) => (
                            <button
                              key={sticker}
                              className="sticker-choice"
                              onClick={() => {
                                setDraftSticker(sticker);
                                setShowComposerPopup(false);
                                setComposerPopupView('menu');
                              }}
                            >
                              {sticker}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              {(uploading || sharingLocation) && <span className="upload-status">{uploading ? 'Uploading...' : 'Sharing location...'}</span>}
              <input ref={photoInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleAttachmentSelection(e.target.files)} />
              <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => handleAttachmentSelection(e.target.files)} />
            </div>

            <div className="composer">
              <input
                value={message}
                onChange={(e) => sendTypingEvent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Type a message"
              />
              <button onClick={handleSendMessage} disabled={uploading}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">Search people to connect, approve requests, then start chatting.</div>
        )}
      </main>

      {incomingCall && (
        <div className="call-banner">
          <div>
            <strong>{incomingCall.caller.username}</strong>
            <span>{incomingCall.type} call incoming</span>
          </div>
          <div className="group-actions">
            <button className="ghost-button" onClick={acceptCall}>Accept</button>
            <button className="danger-button" onClick={rejectCall}>Reject</button>
          </div>
        </div>
      )}

      {callState && (
        <div className="call-modal-scrim">
          <div className="call-modal-card">
            <div className="call-panel">
              <div className="call-panel-header">
                <div>
                  <strong>{callState.type === 'video' ? 'Video Meeting' : 'Voice Meeting'}</strong>
                  <span>
                    {callState.phase === 'ringing' && `Calling ${callState.recipientName || 'connection'}...`}
                    {callState.phase === 'connecting' && 'Joining meeting...'}
                    {callState.phase === 'connected' && 'Both participants are connected'}
                  </span>
                </div>
                <div className="call-inline-actions">
                  <button className="ghost-button" onClick={toggleMicrophone}>
                    {isMicEnabled ? 'Mute' : 'Unmute'}
                  </button>
                  {callState.type === 'video' && (
                    <button className="ghost-button" onClick={toggleCamera}>
                      {isCameraEnabled ? 'Camera Off' : 'Camera On'}
                    </button>
                  )}
                  <button className="danger-button" onClick={endCall}>Leave</button>
                </div>
              </div>

              <div className={`call-media-grid ${callState.type === 'voice' ? 'voice-only' : ''}`}>
                <div className="call-media-card">
                  {callState.type === 'video' ? (
                    <video ref={localVideoRef} autoPlay muted playsInline className="call-video" />
                  ) : (
                    <div className="call-audio-avatar">{getInitials(user.username)}</div>
                  )}
                  <span>You</span>
                </div>
                <div className="call-media-card remote">
                  {callState.type === 'video' ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="call-video" />
                  ) : (
                    <div className="call-audio-avatar accent">{getInitials(callState.recipientName || activeChat?.username || 'Friend')}</div>
                  )}
                  <span>{callState.recipientName || activeChat?.username || 'Connection'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(callState || incomingCall) && <audio ref={remoteAudioRef} autoPlay playsInline className="sr-only-media" />}

      {showInvitePanel && (
        <div className="modal-scrim" onClick={() => setShowInvitePanel(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Invite a Friend</h3>
                <p>Send a registration link directly to their email.</p>
              </div>
              <button
                className="modal-close"
                onClick={() => {
                  setShowInvitePanel(false);
                  setInviteStatus('');
                }}
              >
                x
              </button>
            </div>
            <form className="modal-form" onSubmit={handleInviteSubmit}>
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteStatus('');
                }}
                required
              />
              {inviteStatus && <div className="auth-info">{inviteStatus}</div>}
              <button type="submit">Send Invite</button>
            </form>
          </div>
        </div>
      )}

      <div className="quick-fab-stack">
        <button className="people-fab" onClick={() => navigate('/people')}>
          <span>⇄</span>
          <strong>People</strong>
        </button>
        {appConfig.features?.status && (
          <button className="status-fab" onClick={() => navigate('/status')}>
            <span>◉</span>
            <strong>Status</strong>
          </button>
        )}
      </div>
    </div>
  );
}

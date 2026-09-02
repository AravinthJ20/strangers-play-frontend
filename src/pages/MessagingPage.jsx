import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiBell,
  FiEdit2,
  FiEye,
  FiFileText,
  FiImage,
  FiMenu,
  FiSearch,
  FiShare2,
  FiChevronLeft,
  FiLogOut,
  FiMapPin,
  FiMic,
  FiMoreVertical,
  FiPaperclip,
  FiPhone,
  FiPlus,
  FiSend,
  FiSmile,
  FiStopCircle,
  FiThumbsDown,
  FiThumbsUp,
  FiTrash2,
  FiUserPlus,
  FiUsers,
  FiVideo,
  FiX
} from 'react-icons/fi';
import { MdDone, MdDoneAll, MdSchedule } from 'react-icons/md';
import { io } from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';
import { appConfig } from '../config';
import { useAgentCallBridge } from '../hooks/useAgentCallBridge';
import AgentFab from '../components/common/AgentFab';
import {
  acceptConnectionRequest,
  addGroupMembers,
  createGroup,
  fetchChatList,
  fetchConnectionRequests,
  fetchContacts,
  fetchGroupDetails,
  fetchGroupMessages,
  fetchGroups,
  fetchMessages,
  leaveGroup,
  logoutUser,
  rejectConnectionRequest,
  removeGroupMember,
  searchUsers,
  sendConnectionRequest,
  sendInviteEmail,
  subscribeToPush,
  updateGroup,
  uploadChatMedia
} from '../services/api';

const emojiGroups = [
  {
    label: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '🥹', '😂', '🤣', '😊', '🙂', '😉', '😍', '😘', '😗', '😎', '🤩', '🥳', '😇', '🤗', '🤔', '🫡', '🤭', '🤫', '😴', '😌', '🙃', '😬', '🥺', '😢', '😭', '😤', '😡', '🤯', '😱', '😅', '😮', '😏', '🤤']
  },
  {
    label: 'People',
    emojis: ['👍', '👎', '👏', '🙌', '🙏', '🤝', '👋', '🤟', '👌', '✌️', '🤞', '💪', '🫶', '🫡', '🙋', '🤦', '🤷', '💃', '🕺', '🏃', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍👩‍👧', '👨‍👩‍👦', '🧑‍🤝‍🧑']
  },
  {
    label: 'Nature',
    emojis: ['❤️', '🩷', '🧡', '💛', '💚', '🩵', '💙', '💜', '🖤', '🤍', '💐', '🌹', '🌸', '🌼', '🌻', '🍀', '🌿', '🌈', '☀️', '🌤️', '🌙', '⭐', '✨', '⚡', '🔥', '💧', '🌊']
  },
  {
    label: 'Food',
    emojis: ['🍎', '🍕', '🍔', '🍟', '🌮', '🌯', '🍜', '🍣', '🍩', '🍪', '🎂', '🍫', '🍿', '☕', '🧋', '🥤', '🍹', '🍉', '🍓', '🍇']
  },
  {
    label: 'Travel',
    emojis: ['🚗', '🚌', '🚕', '✈️', '🚀', '🛵', '🚲', '🛶', '⛵', '🏝️', '🏖️', '🏔️', '🗺️', '🧭', '🏕️', '🏙️', '🌆', '🌉']
  },
  {
    label: 'Activities',
    emojis: ['⚽', '🏏', '🏀', '🎾', '🏐', '🎮', '🕹️', '🎯', '🎲', '🎵', '🎧', '🎤', '🎬', '📸', '🎉', '🎊', '🏆', '🥇', '🎁', '🧩']
  },
  {
    label: 'Objects',
    emojis: ['📱', '💻', '⌚', '📷', '🎥', '💡', '📚', '📝', '📌', '📎', '✂️', '🔒', '🔑', '💰', '🪙', '💎', '🧸', '🛍️', '🎈', '🕯️']
  },
  {
    label: 'Symbols',
    emojis: ['✅', '❌', '⭕', '❗', '❓', '💯', '💢', '💤', '🆗', '🆒', '🆕', '🔔', '📣', '⬆️', '⬇️', '➡️', '⬅️', '☑️', '⚠️', '🚫']
  }
];
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
    if (attachments.some((entry) => entry?.mimeType?.startsWith('audio/'))) return 'Voice message';
    return attachments.every((entry) => entry.category === 'image') ? 'Photo' : 'Attachment';
  }
  return item.lastMessage?.content || 'No messages yet';
};

const formatRecordingTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const normalizeMimeType = (value, fallback = 'application/octet-stream') => {
  const normalized = `${value || ''}`.split(';')[0].trim().toLowerCase();
  return normalized || fallback;
};

const resolveMediaSource = (publicUrl) => {
  if (!publicUrl) return '';
  if (/^https?:\/\//i.test(publicUrl)) return publicUrl;
  return `${appConfig.mediaBaseUrl}${publicUrl}`;
};

const getReactionCount = (message, value) => (message.reactions || []).filter((reaction) => reaction.value === value).length;

const getUserReaction = (message, userId) => (message.reactions || []).find((reaction) => reaction.user === userId || reaction.user?._id === userId)?.value || '';

const buildLocationMapUrl = (latitude, longitude) => `https://www.google.com/maps?q=${latitude},${longitude}`;
const normalizeGroupRecord = (group) => ({ ...group, group: true });
const escapeMentionPattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const renderMessageStatusIcon = (status) => {
  if (status === 'read') {
    return <MdDoneAll className="message-status-icon" aria-hidden="true" />;
  }

  if (status === 'delivered') {
    return <MdDoneAll className="message-status-icon" aria-hidden="true" />;
  }

  if (status === 'sent') {
    return <MdDone className="message-status-icon" aria-hidden="true" />;
  }

  return <MdSchedule className="message-status-icon" aria-hidden="true" />;
};

const renderMessageWithMentions = (content, mentions = []) => {
  if (!content) return null;
  if (!Array.isArray(mentions) || mentions.length === 0) return content;

  const uniqueMentions = mentions.filter((member, index, array) => member?.username && array.findIndex((entry) => entry?.username === member.username) === index);
  if (uniqueMentions.length === 0) return content;

  const mentionPattern = new RegExp(`(@(?:${uniqueMentions.map((member) => escapeMentionPattern(member.username)).join('|')}))`, 'gi');
  const parts = content.split(mentionPattern);

  return parts.map((part, index) => {
    const matchedMention = uniqueMentions.find((member) => part.toLowerCase() === `@${member.username}`.toLowerCase());
    if (matchedMention) {
      return (
        <span key={`${matchedMention._id || matchedMention.username}-${index}`} className="message-mention">
          {part}
        </span>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
};

const StreamTile = ({ stream, mode, muted = false, label, avatarLabel, accent = false }) => {
  const mediaRef = useRef(null);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.srcObject = stream || null;
    }
  }, [stream]);

  return (
    <div className="call-media-card">
      {mode === 'video' ? (
        <video ref={mediaRef} autoPlay playsInline muted={muted} className="call-video" />
      ) : (
        <>
          <audio ref={mediaRef} autoPlay muted={muted} className="sr-only-media" />
          <div className={`call-audio-avatar ${accent ? 'accent' : ''}`}>{avatarLabel}</div>
        </>
      )}
      <span>{label}</span>
    </div>
  );
};

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
      <div className="location-card-pin">
        <FiMapPin className="ui-icon" />
      </div>
      <div className="location-card-copy">
        <strong>{location.label || 'Shared location'}</strong>
        <span>{coordinateLabel}</span>
        <small>Open in Maps</small>
      </div>
    </a>
  );
};

const ChatListAvatar = ({ item }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const label = item.name || item.username || 'Chat';
  const avatarSource = resolveMediaSource(item.avatar);

  return (
    <div className={`chat-list-avatar${item.group ? ' group' : ''}`}>
      {avatarSource && !imageFailed ? (
        <img src={avatarSource} alt={label} className="chat-list-avatar-image" onError={() => setImageFailed(true)} />
      ) : item.group ? (
        <FiUsers className="ui-icon" aria-hidden="true" />
      ) : (
        getInitials(label)
      )}
      {!item.group && <span className={`status-dot avatar-status-dot ${item.online ? 'online' : 'offline'}`} />}
    </div>
  );
};

const MediaPreview = ({ attachment }) => {
  const source = resolveMediaSource(attachment.publicUrl);
  if (attachment.category === 'image') {
    return <img src={source} alt={attachment.originalName} className="message-image" onClick={(event) => event.stopPropagation()} />;
  }

  if (attachment.mimeType?.startsWith('audio/')) {
    return (
      <audio className="voice-note-player" controls preload="metadata" onClick={(event) => event.stopPropagation()}>
        <source src={source} type={attachment.mimeType} />
      </audio>
    );
  }

  return (
    <a className="file-chip" href={source} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
      <span className="file-chip-badge">
        <FiFileText className="ui-icon" />
      </span>
      <span>{attachment.originalName}</span>
    </a>
  );
};

export default function ChatPage({ user, onLogoutComplete }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [connections, setConnections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [historyPageInfo, setHistoryPageInfo] = useState({ hasMore: false, nextCursor: null });
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [mentionState, setMentionState] = useState({ open: false, query: '', startIndex: -1, endIndex: -1, selectedIndex: 0 });
  const [draftSticker, setDraftSticker] = useState('');
  const [draftAttachments, setDraftAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [voiceRecordingState, setVoiceRecordingState] = useState({ active: false, durationSeconds: 0 });
  const [showComposerPopup, setShowComposerPopup] = useState(false);
  const [composerPopupView, setComposerPopupView] = useState('menu');
  const [activeTab, setActiveTab] = useState('chats');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [typingState, setTypingState] = useState({ direct: '', group: '' });
  const [groupDraft, setGroupDraft] = useState({ name: '', description: '', members: [] });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupMemberPicker, setShowGroupMemberPicker] = useState(false);
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showRenameGroupModal, setShowRenameGroupModal] = useState(false);
  const [showGroupOptionsMenu, setShowGroupOptionsMenu] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [groupActionError, setGroupActionError] = useState('');
  const [renameGroupDraft, setRenameGroupDraft] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [memberIdsToAdd, setMemberIdsToAdd] = useState([]);
  const [chatError, setChatError] = useState('');
  const [editingMessageId, setEditingMessageId] = useState('');
  const [editingMessageText, setEditingMessageText] = useState('');
  const [openMessageMenuId, setOpenMessageMenuId] = useState('');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardTargets, setForwardTargets] = useState([]);
  const [forwardMessageToSend, setForwardMessageToSend] = useState(null);
  const [callState, setCallState] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [groupCallState, setGroupCallState] = useState(null);
  const [incomingGroupCall, setIncomingGroupCall] = useState(null);
  const [groupCallParticipants, setGroupCallParticipants] = useState([]);
  const [callError, setCallError] = useState('');
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const activeChatRef = useRef(activeChat);
  const callStateRef = useRef(callState);
  const startCallRef = useRef(null);
  const loadConversationRef = useRef(null);
  const incomingCallRef = useRef(incomingCall);
  const groupCallStateRef = useRef(groupCallState);
  const connectionsRef = useRef(connections);
  const directTypingTimeoutRef = useRef(null);
  const groupTypingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const notificationPermissionRef = useRef(false);
  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const groupPeerConnectionsRef = useRef(new Map());
  const groupRemoteStreamsRef = useRef(new Map());
  const groupPendingIceCandidatesRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const toneIntervalRef = useRef(null);
  const toneTimeoutRef = useRef(null);
  const voiceRecorderRef = useRef(null);
  const voiceRecordingStreamRef = useRef(null);
  const voiceRecordingChunksRef = useRef([]);
  const voiceRecordingTimerRef = useRef(null);
  const preserveScrollRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);
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

  const clearVoiceRecordingTimer = () => {
    if (voiceRecordingTimerRef.current) {
      window.clearInterval(voiceRecordingTimerRef.current);
      voiceRecordingTimerRef.current = null;
    }
  };

  const resetVoiceRecorder = () => {
    clearVoiceRecordingTimer();
    voiceRecorderRef.current = null;
    voiceRecordingChunksRef.current = [];
    stopStream(voiceRecordingStreamRef.current);
    voiceRecordingStreamRef.current = null;
    setVoiceRecordingState({ active: false, durationSeconds: 0 });
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

  const clearGroupPeerConnections = () => {
    groupPeerConnectionsRef.current.forEach((connection) => {
      connection.ontrack = null;
      connection.onicecandidate = null;
      connection.onconnectionstatechange = null;
      connection.close();
    });
    groupPeerConnectionsRef.current.clear();
    groupRemoteStreamsRef.current.clear();
    groupPendingIceCandidatesRef.current.clear();
  };

  const clearMediaSession = () => {
    clearPeerConnection();
    clearGroupPeerConnections();
    stopStream(localStreamRef.current);
    stopStream(remoteStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingIceCandidatesRef.current = [];
    setGroupCallParticipants([]);
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
    setGroups(groupData.map(normalizeGroupRecord));
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

  const getActiveMentionState = (nextValue, selectionStart = nextValue.length) => {
    if (!activeChat?.group) {
      return { open: false, query: '', startIndex: -1, endIndex: -1, selectedIndex: 0 };
    }

    const safeSelection = Number.isFinite(selectionStart) ? selectionStart : nextValue.length;
    const textBeforeCursor = nextValue.slice(0, safeSelection);
    const match = textBeforeCursor.match(/(^|\s)@([a-zA-Z0-9._-]*)$/);

    if (!match) {
      return { open: false, query: '', startIndex: -1, endIndex: -1, selectedIndex: 0 };
    }

    return {
      open: true,
      query: match[2] || '',
      startIndex: safeSelection - match[2].length - 1,
      endIndex: safeSelection,
      selectedIndex: 0
    };
  };

  const updateMentionStateForValue = (nextValue, selectionStart) => {
    setMentionState((prev) => {
      const nextMentionState = getActiveMentionState(nextValue, selectionStart);
      if (!nextMentionState.open) return nextMentionState;
      return {
        ...nextMentionState,
        selectedIndex: prev.open && prev.query === nextMentionState.query ? prev.selectedIndex : 0
      };
    });
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

  const openForwardModal = (messageToForward) => {
    setForwardMessageToSend(messageToForward);
    setForwardTargets([]);
    setShowForwardModal(true);
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

  const displayedMessages = useMemo(() => {
    const term = (messageSearchTerm || '').trim().toLowerCase();
    if (!term) return messages;
    return messages.filter((m) => {
      if (m.isDeleted) return false;
      if (m.content && m.content.toLowerCase().includes(term)) return true;
      if (m.sticker && String(m.sticker).toLowerCase().includes(term)) return true;
      if (m.attachments && m.attachments.some((a) => (a.originalName || '').toLowerCase().includes(term))) return true;
      if (m.sender && (m.sender.username || '').toLowerCase().includes(term)) return true;
      return false;
    });
  }, [messages, messageSearchTerm]);

  const upsertChatItem = (messagePayload, isGroup) => {
    if (isGroup) {
      setChats((prev) => prev.map((chat) => (chat._id === messagePayload.group ? { ...chat, lastMessage: messagePayload } : chat)));
      setGroups((prev) => prev.map((group) => (group._id === messagePayload.group ? { ...group, lastMessage: messagePayload, group: true } : group)));
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

  const getGroupMessageViewerNames = (msg) => {
    if (!activeChat?.group || msg.sender._id !== user._id || !Array.isArray(msg.readBy) || msg.readBy.length === 0) {
      return [];
    }

    const readByIds = msg.readBy.map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry?._id) return entry._id.toString();
      return entry?.toString?.() || '';
    });

    return (activeChat.members || [])
      .filter((member) => member?._id && readByIds.includes(member._id.toString()) && member._id.toString() !== user._id)
      .map((member) => member.username);
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
      const response = resolvedChat.group
        ? await fetchGroupMessages(resolvedChat._id, token, { limit: 30 })
        : await fetchMessages(resolvedChat._id, token, { limit: 30 });

      const loadedMessages = response.messages || [];
      setMessages(loadedMessages);
      setHistoryPageInfo(response.pageInfo || { hasMore: false, nextCursor: null });
      shouldStickToBottomRef.current = true;

      if (resolvedChat.group) {
        socket?.emit('join-group', resolvedChat._id);
      }

      markMessagesRead(loadedMessages, resolvedChat);
    } catch (error) {
      setMessages([]);
      setHistoryPageInfo({ hasMore: false, nextCursor: null });
      setChatError(error.response?.data?.error || 'Unable to load chat.');
    }
  };

  loadConversationRef.current = loadConversation;

  useEffect(() => {
  const selectedUser = location.state?.selectedUser;

  if (!selectedUser || !socket) return;

  loadConversation(selectedUser);

  navigate(location.pathname, {
    replace: true,
    state: {},
  });
}, [location.state?.selectedUser, socket]);
  const loadOlderMessages = async () => {
    if (!activeChat || !historyPageInfo.hasMore || !historyPageInfo.nextCursor || loadingOlderMessages) return;

    const scrollContainer = messagesAreaRef.current;
    preserveScrollRef.current = scrollContainer
      ? {
          previousHeight: scrollContainer.scrollHeight,
          previousTop: scrollContainer.scrollTop
        }
      : null;

    setLoadingOlderMessages(true);
    shouldStickToBottomRef.current = false;

    try {
      const response = activeChat.group
        ? await fetchGroupMessages(activeChat._id, token, { limit: 30, before: historyPageInfo.nextCursor })
        : await fetchMessages(activeChat._id, token, { limit: 30, before: historyPageInfo.nextCursor });

      const olderMessages = response.messages || [];
      setMessages((prev) => {
        const existingIds = new Set(prev.map((entry) => entry._id));
        const dedupedOlder = olderMessages.filter((entry) => !existingIds.has(entry._id));
        return [...dedupedOlder, ...prev];
      });
      setHistoryPageInfo(response.pageInfo || { hasMore: false, nextCursor: null });
    } catch (error) {
      setChatError(error.response?.data?.error || 'Unable to load older messages.');
    } finally {
      setLoadingOlderMessages(false);
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

  const upsertGroupParticipant = (participant) => {
    if (!participant?._id) return;

    setGroupCallParticipants((prev) => {
      const existing = prev.find((entry) => entry._id === participant._id);
      if (existing) {
        return prev.map((entry) => (entry._id === participant._id ? { ...entry, ...participant } : entry));
      }

      return [...prev, participant];
    });
  };

  const removeGroupParticipant = (participantId) => {
    setGroupCallParticipants((prev) => prev.filter((entry) => entry._id !== participantId));
    const remoteStream = groupRemoteStreamsRef.current.get(participantId);
    stopStream(remoteStream);
    groupRemoteStreamsRef.current.delete(participantId);

    const connection = groupPeerConnectionsRef.current.get(participantId);
    if (connection) {
      connection.close();
      groupPeerConnectionsRef.current.delete(participantId);
    }
    groupPendingIceCandidatesRef.current.delete(participantId);
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

  const flushPendingGroupCandidates = async (participantId) => {
    const peerConnection = groupPeerConnectionsRef.current.get(participantId);
    if (!peerConnection || !peerConnection.remoteDescription) return;

    const queuedCandidates = groupPendingIceCandidatesRef.current.get(participantId) || [];
    while (queuedCandidates.length > 0) {
      const candidate = queuedCandidates.shift();
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Failed to add buffered group ICE candidate:', error);
      }
    }
    groupPendingIceCandidatesRef.current.set(participantId, queuedCandidates);
  };

  const createGroupPeerConnection = (participant, callId, type) => {
    const participantId = participant._id;
    const existingConnection = groupPeerConnectionsRef.current.get(participantId);
    if (existingConnection) {
      existingConnection.close();
    }

    const peerConnection = new RTCPeerConnection(rtcConfig);
    groupPeerConnectionsRef.current.set(participantId, peerConnection);

    let remoteStream = groupRemoteStreamsRef.current.get(participantId);
    if (!remoteStream) {
      remoteStream = new MediaStream();
      groupRemoteStreamsRef.current.set(participantId, remoteStream);
    }

    peerConnection.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!remoteStream.getTracks().some((entry) => entry.id === track.id)) {
          remoteStream.addTrack(track);
        }
      });

      upsertGroupParticipant({
        _id: participantId,
        username: participant.username,
        avatar: participant.avatar || '',
        stream: remoteStream,
        isLocal: false
      });
      stopCallTone();
      setGroupCallState((prev) => (prev && prev.callId === callId ? { ...prev, phase: 'connected' } : prev));
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('group-call-ice-candidate', {
          callId,
          recipientId: participantId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const connectionState = peerConnection.connectionState;
      if (connectionState === 'failed' || connectionState === 'disconnected' || connectionState === 'closed') {
        removeGroupParticipant(participantId);
      }
    };

    localStreamRef.current?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current);
    });

    upsertGroupParticipant({
      _id: participantId,
      username: participant.username,
      avatar: participant.avatar || '',
      stream: remoteStream,
      isLocal: false,
      mode: type
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

  const handleIncomingGroupIceCandidate = async ({ participantId, candidate }) => {
    if (!candidate || !participantId) return;

    const peerConnection = groupPeerConnectionsRef.current.get(participantId);
    if (!peerConnection || !peerConnection.remoteDescription) {
      const queuedCandidates = groupPendingIceCandidatesRef.current.get(participantId) || [];
      queuedCandidates.push(candidate);
      groupPendingIceCandidatesRef.current.set(participantId, queuedCandidates);
      return;
    }

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Unable to add group ICE candidate:', error);
    }
  };

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    setMentionState({ open: false, query: '', startIndex: -1, endIndex: -1, selectedIndex: 0 });
    setShowGroupOptionsMenu(false);
  }, [activeChat?._id]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    groupCallStateRef.current = groupCallState;
  }, [groupCallState]);

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

    socketClient.on('group-call-invite', (payload) => {
      setCallError('');
      startIncomingTone();
      showSystemNotification(
        `${payload.caller.username} started a group call`,
        `${payload.type === 'video' ? 'Video' : 'Voice'} call in ${payload.groupName}`,
        { tag: `group-call-${payload.callId}` }
      );
      setIncomingGroupCall(payload);
    });

    socketClient.on('group-call-joined', ({ callId, groupId, groupName, type, hostId, participants }) => {
      setGroupCallState({ callId, groupId, groupName, type, hostId, phase: 'connecting' });
      setGroupCallParticipants((prev) => {
        const localParticipant = prev.find((entry) => entry._id === user._id) || {
          _id: user._id,
          username: user.username,
          avatar: user.avatar || '',
          stream: localStreamRef.current,
          isLocal: true,
          mode: type
        };

        return [localParticipant, ...(participants || []).map((participant) => ({ ...participant, isLocal: false, mode: type }))];
      });
    });

    socketClient.on('group-call-participant-joined', async ({ callId, participant }) => {
      if (!groupCallStateRef.current || groupCallStateRef.current.callId !== callId) return;

      upsertGroupParticipant({ ...participant, isLocal: false, mode: groupCallStateRef.current.type });

      try {
        const peerConnection = createGroupPeerConnection(participant, callId, groupCallStateRef.current.type);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        const serializedOffer = toSessionDescriptionPayload(peerConnection.localDescription);
        if (!serializedOffer) return;

        socketClient.emit('group-call-offer', {
          callId,
          recipientId: participant._id,
          offer: serializedOffer
        });
      } catch (error) {
        console.error('Unable to create group call offer:', error);
      }
    });

    socketClient.on('group-call-offer', async ({ callId, sender, offer }) => {
      try {
        if (!groupCallStateRef.current || groupCallStateRef.current.callId !== callId || !offer) return;

        const peerConnection = createGroupPeerConnection(sender, callId, groupCallStateRef.current.type);
        const normalizedOffer = toSessionDescriptionPayload(offer);
        if (!normalizedOffer) return;

        await peerConnection.setRemoteDescription(normalizedOffer);
        await flushPendingGroupCandidates(sender._id);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        const serializedAnswer = toSessionDescriptionPayload(peerConnection.localDescription);
        if (!serializedAnswer) return;

        socketClient.emit('group-call-answer', {
          callId,
          recipientId: sender._id,
          answer: serializedAnswer
        });
      } catch (error) {
        console.error('Unable to answer group call offer:', error);
      }
    });

    socketClient.on('group-call-answer', async ({ callId, sender, answer }) => {
      if (!groupCallStateRef.current || groupCallStateRef.current.callId !== callId || !answer) return;

      const peerConnection = groupPeerConnectionsRef.current.get(sender._id);
      if (!peerConnection) return;

      try {
        const normalizedAnswer = toSessionDescriptionPayload(answer);
        if (!normalizedAnswer) return;

        await peerConnection.setRemoteDescription(normalizedAnswer);
        await flushPendingGroupCandidates(sender._id);
      } catch (error) {
        console.error('Unable to apply group call answer:', error);
      }
    });

    socketClient.on('group-call-ice-candidate', async ({ callId, sender, candidate }) => {
      if (!groupCallStateRef.current || groupCallStateRef.current.callId !== callId) return;
      await handleIncomingGroupIceCandidate({ participantId: sender._id, candidate });
    });

    socketClient.on('group-call-participant-left', ({ callId, participantId }) => {
      if (!groupCallStateRef.current || groupCallStateRef.current.callId !== callId) return;
      removeGroupParticipant(participantId);
    });

    socketClient.on('group-call-ended', ({ callId }) => {
      if (!groupCallStateRef.current || groupCallStateRef.current.callId !== callId) return;
      playEndedTone();
      clearMediaSession();
      setGroupCallState(null);
      setIncomingGroupCall(null);
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
  }, [token, user._id, user.username, user.avatar]);

  useEffect(() => {
    refreshSidebar();
  }, []);

  useEffect(() => {
    syncVideoElements();
  }, [callState, incomingCall]);

  useEffect(() => {
    if (preserveScrollRef.current && messagesAreaRef.current) {
      const { previousHeight, previousTop } = preserveScrollRef.current;
      const nextHeight = messagesAreaRef.current.scrollHeight;
      messagesAreaRef.current.scrollTop = previousTop + (nextHeight - previousHeight);
      preserveScrollRef.current = null;
      return;
    }

    if (shouldStickToBottomRef.current) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingState, draftAttachments]);

  const handleMessagesScroll = () => {
    const container = messagesAreaRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
    shouldStickToBottomRef.current = distanceFromBottom < 80;

    if (container.scrollTop <= 60 && historyPageInfo.hasMore && !loadingOlderMessages) {
      loadOlderMessages();
    }
  };

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

  useEffect(
    () => () => {
      if (voiceRecorderRef.current?.state === 'recording') {
        try {
          voiceRecorderRef.current.stop();
        } catch (error) {
          console.error('Unable to stop voice recorder during cleanup:', error);
        }
      }
      resetVoiceRecorder();
    },
    []
  );

  const handleAttachmentSelection = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setUploading(true);
    setChatError('');

    try {
      const uploadedFiles = [];
      for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        const normalizedMimeType = normalizeMimeType(file.type, 'application/octet-stream');
        const uploaded = await uploadChatMedia(
          {
            fileName: file.name,
            mimeType: normalizedMimeType,
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

  const startVoiceRecording = async () => {
    if (voiceRecordingState.active || uploading) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === 'undefined') {
      setChatError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      setChatError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((entry) => window.MediaRecorder.isTypeSupported?.(entry)) ||
        '';
      const recorder = mimeType ? new window.MediaRecorder(stream, { mimeType }) : new window.MediaRecorder(stream);

      voiceRecordingStreamRef.current = stream;
      voiceRecorderRef.current = recorder;
      voiceRecordingChunksRef.current = [];
      setVoiceRecordingState({ active: true, durationSeconds: 0 });
      clearVoiceRecordingTimer();
      voiceRecordingTimerRef.current = window.setInterval(() => {
        setVoiceRecordingState((prev) => (prev.active ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : prev));
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          voiceRecordingChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setChatError('Voice recording failed. Please try again.');
        resetVoiceRecorder();
      };

      recorder.onstop = async () => {
        const chunks = [...voiceRecordingChunksRef.current];
        const recordedMimeType = normalizeMimeType(recorder.mimeType, 'audio/webm');
        resetVoiceRecorder();

        if (chunks.length === 0) return;

        setUploading(true);
        try {
          const blob = new Blob(chunks, { type: recordedMimeType });
          const extension = recordedMimeType.includes('ogg') ? 'ogg' : recordedMimeType.includes('mp4') ? 'm4a' : 'webm';
          const file = new File([blob], `voice-note-${Date.now()}.${extension}`, { type: recordedMimeType });
          const dataUrl = await readFileAsDataUrl(file);
          const uploaded = await uploadChatMedia(
            {
              fileName: file.name,
              mimeType: normalizeMimeType(file.type, 'audio/webm'),
              dataUrl
            },
            token
          );
          setDraftAttachments((prev) => [...prev, uploaded]);
        } catch (error) {
          setChatError(error.response?.data?.error || error.message || 'Unable to upload voice message.');
        } finally {
          setUploading(false);
          setShowComposerPopup(false);
          setComposerPopupView('menu');
        }
      };

      recorder.start();
      setShowComposerPopup(false);
      setComposerPopupView('menu');
    } catch (error) {
      setChatError('Microphone access is required to record a voice message.');
      resetVoiceRecorder();
    }
  };

  const stopVoiceRecording = () => {
    if (!voiceRecorderRef.current || voiceRecorderRef.current.state !== 'recording') return;
    voiceRecorderRef.current.stop();
  };

  const sendTypingEvent = (nextValue) => {
    setMessage(nextValue);
    updateMentionStateForValue(nextValue, messageInputRef.current?.selectionStart ?? nextValue.length);
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
    if ((!trimmedMessage && !draftSticker && draftAttachments.length === 0) || !activeChat || !socket || uploading || voiceRecordingState.active) return;

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
      attachmentIds: draftAttachments.map((entry) => entry._id),
      mentionIds: activeChat.group
        ? (activeChat.members || [])
            .filter((member) => new RegExp(`(^|\\s)@${member.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s,!.?:;]|$)`, 'i').test(trimmedMessage))
            .map((member) => member._id)
        : []
    };

    if (activeChat.group) {
      socket.emit('group-message', { ...payload, groupId: activeChat._id });
    } else {
      socket.emit('personal-message', { ...payload, recipientId: activeChat._id });
    }

    setMessage('');
    setMentionState({ open: false, query: '', startIndex: -1, endIndex: -1, selectedIndex: 0 });
    clearComposerExtras();
    setShowComposerPopup(false);
    setComposerPopupView('menu');
  };

  const handleConnectionRequest = async (targetUser) => {
    try {
      await sendConnectionRequest(targetUser._id, token);
      setOutgoingRequests((prev) => [...prev.filter((entry) => entry._id !== targetUser._id), { ...targetUser, connectionStatus: 'interested' }]);
      setIncomingRequests((prev) => prev.filter((entry) => entry._id !== targetUser._id));
      updateSearchStatus(targetUser._id, 'interested');
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

      const normalizedGroup = normalizeGroupRecord(group);
      setGroups((prev) => [normalizedGroup, ...prev]);
      setChats((prev) => [normalizedGroup, ...prev]);
      setShowCreateGroup(false);
      setShowGroupMemberPicker(false);
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
      const normalizedGroup = normalizeGroupRecord(updatedGroup);
      setGroups((prev) => prev.map((entry) => (entry._id === normalizedGroup._id ? { ...entry, ...normalizedGroup } : entry)));
      setChats((prev) => prev.map((entry) => (entry._id === normalizedGroup._id ? { ...entry, ...normalizedGroup } : entry)));
      setActiveChat((prev) => (prev ? { ...prev, ...normalizedGroup } : prev));
      setMemberIdsToAdd([]);
      setGroupActionError('');
      setShowAddMembersModal(false);
    } catch (error) {
      setGroupActionError(error.response?.data?.error || 'Unable to add members.');
    }
  };

  const handleOpenGroupMembers = async () => {
    if (!activeChat?.group) return;

    try {
      const latestGroup = await fetchGroupDetails(activeChat._id, token);
      const normalizedGroup = normalizeGroupRecord(latestGroup);
      setGroups((prev) => prev.map((entry) => (entry._id === normalizedGroup._id ? { ...entry, ...normalizedGroup } : entry)));
      setChats((prev) => prev.map((entry) => (entry._id === normalizedGroup._id ? { ...entry, ...normalizedGroup } : entry)));
      setActiveChat((prev) => (prev ? { ...prev, ...normalizedGroup } : prev));
      setGroupActionError('');
      setShowGroupMembersModal(true);
    } catch (error) {
      setGroupActionError(error.response?.data?.error || 'Unable to load group members.');
    }
  };

  const handleOpenRenameGroup = () => {
    if (!activeChat?.group) return;
    setRenameGroupDraft({
      name: activeChat.name || '',
      description: activeChat.description || ''
    });
    setGroupActionError('');
    setShowRenameGroupModal(true);
  };

  const handleOpenAddMembers = () => {
    setMemberIdsToAdd([]);
    setGroupActionError('');
    setShowAddMembersModal(true);
  };

  const handleRenameGroup = async (event) => {
    event.preventDefault();
    if (!activeChat?.group) return;

    try {
      const updatedGroup = await updateGroup(
        activeChat._id,
        {
          name: renameGroupDraft.name,
          description: renameGroupDraft.description
        },
        token
      );
      const normalizedGroup = normalizeGroupRecord(updatedGroup);
      setGroups((prev) => prev.map((entry) => (entry._id === normalizedGroup._id ? { ...entry, ...normalizedGroup } : entry)));
      setChats((prev) => prev.map((entry) => (entry._id === normalizedGroup._id ? { ...entry, ...normalizedGroup } : entry)));
      setActiveChat((prev) => (prev ? { ...prev, ...normalizedGroup } : prev));
      setGroupActionError('');
      setShowRenameGroupModal(false);
    } catch (error) {
      setGroupActionError(error.response?.data?.error || 'Unable to rename group.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!activeChat?.group) return;

    try {
      const updatedGroup = await removeGroupMember(activeChat._id, memberId, token);
      const normalizedGroup = normalizeGroupRecord(updatedGroup);
      setGroups((prev) => prev.map((entry) => (entry._id === normalizedGroup._id ? { ...entry, ...normalizedGroup } : entry)));
      setChats((prev) => prev.map((entry) => (entry._id === normalizedGroup._id ? { ...entry, ...normalizedGroup } : entry)));
      setActiveChat((prev) => (prev ? { ...prev, ...normalizedGroup } : prev));
      setGroupActionError('');
    } catch (error) {
      setGroupActionError(error.response?.data?.error || 'Unable to remove member.');
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

  const startGroupCall = async (type) => {
    if (!socket || !activeChat?.group) return;

    try {
      setCallError('');
      const callId = `group-call-${Date.now()}`;
      await ensureLocalStream(type);
      setGroupCallParticipants([
        {
          _id: user._id,
          username: user.username,
          avatar: user.avatar || '',
          stream: localStreamRef.current,
          isLocal: true,
          mode: type
        }
      ]);
      setGroupCallState({
        callId,
        groupId: activeChat._id,
        groupName: activeChat.name,
        type,
        hostId: user._id,
        phase: 'ringing'
      });
      startOutgoingTone();
      socket.emit('group-call-start', {
        groupId: activeChat._id,
        callId,
        type
      });
    } catch (error) {
      console.error('Unable to start group call:', error);
      setCallError(error.message || 'Unable to start the group call.');
      clearMediaSession();
      setGroupCallState(null);
      setGroupCallParticipants([]);
    }
  };

  const startCall = async (type) => {
    if (activeChat?.group) {
      await startGroupCall(type);
      return;
    }
    if (!socket || !activeChat) return;

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

  startCallRef.current = startCall;

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

  const acceptGroupCall = async () => {
    if (!incomingGroupCall || !socket) return;

    try {
      setCallError('');
      await ensureLocalStream(incomingGroupCall.type);
      setGroupCallParticipants([
        {
          _id: user._id,
          username: user.username,
          avatar: user.avatar || '',
          stream: localStreamRef.current,
          isLocal: true,
          mode: incomingGroupCall.type
        }
      ]);
      setGroupCallState({
        callId: incomingGroupCall.callId,
        groupId: incomingGroupCall.groupId,
        groupName: incomingGroupCall.groupName,
        type: incomingGroupCall.type,
        hostId: incomingGroupCall.caller._id,
        phase: 'connecting'
      });
      socket.emit('group-call-join', { callId: incomingGroupCall.callId });
      stopCallTone();
      setIncomingGroupCall(null);
    } catch (error) {
      console.error('Unable to join group call:', error);
      setCallError(error.message || 'Unable to join the group call.');
      clearMediaSession();
      setGroupCallState(null);
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

  const rejectGroupCall = () => {
    stopCallTone();
    setIncomingGroupCall(null);
  };

  const endCall = () => {
    if (groupCallState && socket) {
      socket.emit('group-call-leave', { callId: groupCallState.callId });
      playEndedTone();
      clearMediaSession();
      setGroupCallState(null);
      return;
    }

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

  const selectedGroupMembers = useMemo(
    () => connections.filter((entry) => groupDraft.members.includes(entry._id)),
    [connections, groupDraft.members]
  );

  const isGroupAdmin = Boolean(activeChat?.group && (activeChat.admin?._id || activeChat.admin) === user._id);

  const mentionSuggestions = useMemo(() => {
    if (!mentionState.open || !activeChat?.group) return [];

    const members = (activeChat.members || []).filter((member) => (member._id || member) !== user._id);
    const query = mentionState.query.trim().toLowerCase();

    if (!query) return members.slice(0, 6);

    return members
      .filter((member) => member.username?.toLowerCase().includes(query))
      .slice(0, 6);
  }, [activeChat, mentionState, user._id]);

  useAgentCallBridge({
    connections,
    chats,
    activeChat,
    socket,
    loadConversationRef,
    startCallRef
  });

  const insertMention = (member) => {
    if (!member || mentionState.startIndex < 0) return;

    const nextValue = `${message.slice(0, mentionState.startIndex)}@${member.username} ${message.slice(mentionState.endIndex)}`;
    setMessage(nextValue);
    setMentionState({ open: false, query: '', startIndex: -1, endIndex: -1, selectedIndex: 0 });

    requestAnimationFrame(() => {
      const nextCursorPosition = mentionState.startIndex + member.username.length + 2;
      if (messageInputRef.current) {
        messageInputRef.current.focus();
        messageInputRef.current.setSelectionRange(nextCursorPosition, nextCursorPosition);
      }
    });
  };

  const renderSearchAction = (entry) => {
    if (entry.connectionStatus === 'accepted' || entry.connectionStatus === 'connected') {
      return <span className="status-label connected">Open Chat</span>;
    }
    if (entry.connectionStatus === 'interested' || entry.connectionStatus === 'outgoing') {
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
    <div className={`chat-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <header className="app-navbar">
        <div className="app-navbar-brand">
          <button
            className="ghost-button icon-button sidebar-toggle-button"
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? <FiMenu className="ui-icon" /> : <FiChevronLeft className="ui-icon" />}
          </button>
                <img src="/assets/images/Strangers_Play_logo.png" alt="Green Lynk" className="app-navbar-logo" />
          <div>
                  <strong>Green Lynk</strong>
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
    className="request-card request-card-clickable"
    onClick={() => {
      if (
        entry.connectionStatus === 'connected' ||
        entry.connectionStatus === 'accepted'
      ) {
        loadConversation(entry);

        // Close search popup
        setSearchTerm('');
        setSearchResults([]);
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
          <button
            className="ghost-button icon-button nav-request-button"
            type="button"
            onClick={() => navigate('/requests')}
            title="Connection requests"
            aria-label={`${incomingRequests.length} connection request${incomingRequests.length === 1 ? '' : 's'}`}
          >
            <FiBell className="ui-icon" />
            {incomingRequests.length > 0 && (
              <span className="nav-request-badge">{incomingRequests.length > 99 ? '99+' : incomingRequests.length}</span>
            )}
          </button>
          <button className="ghost-button button-with-icon" onClick={() => setShowInvitePanel((prev) => !prev)}>
            <FiUserPlus className="ui-icon" />
            Invite Friends
          </button>
          <button className="ghost-button button-with-icon" onClick={() => setShowCreateGroup((prev) => !prev)}>
            <FiUsers className="ui-icon" />
            New Group
          </button>
          <button className="ghost-button button-with-icon" onClick={handleLogout}>
            <FiLogOut className="ui-icon" />
            Logout
          </button>
        </div>
      </header>
      <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-collapse-content">
          <div className="sidebar-header sidebar-profile-card">
            <div className="sidebar-profile-details">
              <div className="sidebar-user-row">
                <div className="sidebar-avatar">
                  {user.avatar ? <img src={user.avatar} alt={user.username} className="sidebar-avatar-image" /> : getInitials(user.username)}
                </div>
                <div className="sidebar-user">
                  <strong>{user.username}</strong>
                </div>
              </div>
              <div className="sidebar-profile-meta">
               
                <span>{connections.length} connections</span>
              </div>
            </div>
            <div className="sidebar-profile-actions">
              <button className="ghost-button icon-button profile-icon-button" type="button" onClick={() => navigate('/view/profile')} title="View Profile" aria-label="View Profile">
                <FiEye className="ui-icon" />
              </button>
              <button className="ghost-button icon-button profile-icon-button" type="button" onClick={() => navigate('/edit/profile')} title="Edit Profile" aria-label="Edit Profile">
                <FiEdit2 className="ui-icon" />
              </button>
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
              <div className="group-picker-summary">
                <div className="group-picker-summary-head">
                  <div>
                    <strong>Select people</strong>
                    <p>{selectedGroupMembers.length > 0 ? `${selectedGroupMembers.length} selected` : 'No people selected yet'}</p>
                  </div>
                  <button className="ghost-button" type="button" onClick={() => setShowGroupMemberPicker(true)}>
                    Choose People
                  </button>
                </div>
                {selectedGroupMembers.length > 0 ? (
                  <div className="group-members selected-members">
                    {selectedGroupMembers.map((member) => (
                      <button
                        key={member._id}
                        type="button"
                        className="member-pill removable"
                        onClick={() =>
                          setGroupDraft((prev) => ({
                            ...prev,
                            members: prev.members.filter((id) => id !== member._id)
                          }))
                        }
                      >
                        <span>{member.username}</span>
                        <span className="member-pill-remove">
                          <FiX className="ui-icon" />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state slim group-picker-empty">Selected people will appear here.</div>
                )}
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
                <ChatListAvatar item={item} />
                <div className="chat-item-content">
                  <div className="chat-item-top">
                    <strong>{item.name || item.username}</strong>
                    <small>{formatTime(item.lastMessage?.timestamp)}</small>
                  </div>
                  <div className="chat-item-bottom">
                    <small>{activeTab === 'connections' ? item.email : buildChatPreview(item)}</small>
                  </div>
                </div>
              </div>
            ))}
            {currentList.length === 0 && <div className="empty-state">Nothing to show yet.</div>}
          </div>
        </div>
      </aside>

      <main className="chat-view">
        {activeChat ? (
          <>
            <div className="chat-header">
              <div>
                {!showMessageSearch ? (
                  <>
                    <h2>{activeChat.name || activeChat.username}</h2>
                    <p>{activeChat.group ? `${activeChat.members?.length || 0} members` : activeChat.online ? 'Online' : formatLastSeen(activeChat.lastSeen)}</p>
                  </>
                ) : (
                  <div className="chat-header-search">
                    <input
                      value={messageSearchTerm}
                      onChange={(e) => setMessageSearchTerm(e.target.value)}
                      placeholder="Search messages in this chat"
                      autoFocus
                    />
                    <button className="ghost-button icon-button" onClick={() => { setMessageSearchTerm(''); setShowMessageSearch(false); }} title="Close search">
                      <FiX className="ui-icon" />
                    </button>
                  </div>
                )}
              </div>
              <div className="chat-actions">
                <button className="ghost-button icon-button" onClick={() => setShowMessageSearch((s) => !s)} title="Search messages" aria-label="Search messages">
                  <FiSearch className="ui-icon" />
                </button>
                {!activeChat.group && (
                  <>
                    <button className="ghost-button icon-button" onClick={() => startCall('voice')} title="Voice call" aria-label="Voice call">
                      <FiPhone className="ui-icon" />
                    </button>
                    <button className="ghost-button icon-button" onClick={() => startCall('video')} title="Video call" aria-label="Video call">
                      <FiVideo className="ui-icon" />
                    </button>
                  </>
                )}
                {activeChat.group && (
                  <div className="group-options-anchor">
                    <button
                      className="ghost-button icon-button"
                      type="button"
                      onClick={() => setShowGroupOptionsMenu((prev) => !prev)}
                      title="Group options"
                      aria-label="Group options"
                    >
                      <FiMoreVertical className="ui-icon" />
                    </button>
                    {showGroupOptionsMenu && (
                      <div className="group-options-menu">
                        <button
                          type="button"
                          className="group-options-item"
                          onClick={() => {
                            setShowGroupOptionsMenu(false);
                            startGroupCall('voice');
                          }}
                        >
                          <FiPhone className="ui-icon" />
                          Start Voice Call
                        </button>
                        <button
                          type="button"
                          className="group-options-item"
                          onClick={() => {
                            setShowGroupOptionsMenu(false);
                            startGroupCall('video');
                          }}
                        >
                          <FiVideo className="ui-icon" />
                          Start Video Call
                        </button>
                        <button
                          type="button"
                          className="group-options-item"
                          onClick={() => {
                            setShowGroupOptionsMenu(false);
                            handleOpenGroupMembers();
                          }}
                        >
                          <FiUsers className="ui-icon" />
                          View Members
                        </button>
                        {isGroupAdmin && (
                          <>
                            <button
                              type="button"
                              className="group-options-item"
                              onClick={() => {
                                setShowGroupOptionsMenu(false);
                                handleOpenAddMembers();
                              }}
                            >
                              <FiUserPlus className="ui-icon" />
                              Add Members
                            </button>
                            <button
                              type="button"
                              className="group-options-item"
                              onClick={() => {
                                setShowGroupOptionsMenu(false);
                                handleOpenRenameGroup();
                              }}
                            >
                              <FiEdit2 className="ui-icon" />
                              Change Group Name
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="group-options-item danger"
                          onClick={() => {
                            setShowGroupOptionsMenu(false);
                            handleLeaveGroup();
                          }}
                        >
                          <FiLogOut className="ui-icon" />
                          Leave Group
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {showForwardModal && (
                  <div className="modal-scrim" onClick={() => setShowForwardModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <div>
                          <h3>Forward message</h3>
                          <p>Select connections or groups to forward this message to.</p>
                        </div>
                        <button className="modal-close" onClick={() => setShowForwardModal(false)}>
                          <FiX className="ui-icon" />
                        </button>
                      </div>

                      <div className="modal-form" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                        <div style={{ marginBottom: 12 }}>
                          <strong>Connections</strong>
                        </div>
                        {connections.length > 0 ? (
                          connections.map((entry) => {
                            const key = `u-${entry._id}`;
                            return (
                              <label key={key} className="picker-option picker-option-card">
                                <input
                                  type="checkbox"
                                  checked={forwardTargets.includes(key)}
                                  onChange={() =>
                                    setForwardTargets((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
                                  }
                                />
                                <div className="picker-option-copy">
                                  <strong>{entry.username}</strong>
                                  <span>{entry.email}</span>
                                </div>
                              </label>
                            );
                          })
                        ) : (
                          <div className="empty-state slim">No connections available.</div>
                        )}

                        <div style={{ marginTop: 14, marginBottom: 8 }}>
                          <strong>Groups</strong>
                        </div>
                        {groups.length > 0 ? (
                          groups.map((g) => {
                            const key = `g-${g._id}`;
                            return (
                              <label key={key} className="picker-option picker-option-card">
                                <input
                                  type="checkbox"
                                  checked={forwardTargets.includes(key)}
                                  onChange={() =>
                                    setForwardTargets((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
                                  }
                                />
                                <div className="picker-option-copy">
                                  <strong>{g.name}</strong>
                                  <span>{g.members?.length || 0} members</span>
                                </div>
                              </label>
                            );
                          })
                        ) : (
                          <div className="empty-state slim">No groups available.</div>
                        )}

                        <div style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className="status-label pending">{forwardTargets.length} selected</span>
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={async () => {
                              if (!forwardMessageToSend || !socket || forwardTargets.length === 0) return;
                              const content = forwardMessageToSend.content || '';
                              const sticker = forwardMessageToSend.sticker || '';
                              const attachmentIds = (forwardMessageToSend.attachments || []).map((a) => a._id);

                              for (const key of forwardTargets) {
                                try {
                                  const tempId = `temp-forward-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
                                  const payload = { tempId, content, sticker, attachmentIds };
                                  if (key.startsWith('g-')) {
                                    const groupId = key.slice(2);
                                    socket.emit('group-message', { ...payload, groupId });
                                  } else if (key.startsWith('u-')) {
                                    const recipientId = key.slice(2);
                                    socket.emit('personal-message', { ...payload, recipientId });
                                  }
                                } catch (err) {
                                  console.error('Forward failed for', key, err);
                                }
                              }

                              setShowForwardModal(false);
                              setForwardTargets([]);
                              setForwardMessageToSend(null);
                            }}
                          >
                            Forward
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {callState && <button className="danger-button" onClick={endCall}>End Call</button>}
              </div>
            </div>

            {callError && <div className="chat-error-banner">{callError}</div>}

            {activeChat.group && groupActionError && <div className="chat-error-banner">{groupActionError}</div>}

            <div className="messages-area" ref={messagesAreaRef} onScroll={handleMessagesScroll}>
              {chatError && <div className="chat-error-banner">{chatError}</div>}
              {loadingOlderMessages && <div className="history-loading-indicator">Loading older messages...</div>}
              {displayedMessages.map((msg) => {
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
                        {msg.content && <div>{renderMessageWithMentions(msg.content, msg.mentions)}</div>}
                        {msg.attachments?.length > 0 && (
                          <div className="media-grid">
                            {msg.attachments.map((attachment) => (
                              <MediaPreview key={attachment._id} attachment={attachment} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {canOpenMessageMenu && editingMessageId !== msg._id && (
                      <div className="message-menu-trigger" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="ghost-button icon-button menu-trigger-btn"
                          onClick={() => setOpenMessageMenuId((prev) => (prev === msg._id ? '' : msg._id))}
                          aria-label="Open message actions"
                          title="Message actions"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="5" cy="12" r="1.8" fill="currentColor" />
                            <circle cx="12" cy="12" r="1.8" fill="currentColor" />
                            <circle cx="19" cy="12" r="1.8" fill="currentColor" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {(likeCount > 0 || dislikeCount > 0) && !msg.isDeleted && msg.type !== 'call' && (
                      <div className="message-reaction-summary">
                        {likeCount > 0 && <span className={currentReaction === 'like' ? 'active' : ''}><FiThumbsUp className="ui-icon" /> {likeCount}</span>}
                        {dislikeCount > 0 && <span className={currentReaction === 'dislike' ? 'active' : ''}><FiThumbsDown className="ui-icon" /> {dislikeCount}</span>}
                      </div>
                    )}
                    {openMessageMenuId === msg._id && canOpenMessageMenu && (
                      <div className="message-inline-menu" onClick={(event) => event.stopPropagation()}>
                        {activeChat?.group && getGroupMessageViewerNames(msg).length > 0 && (
                          <div className="message-menu-seen">
                            <small>Seen by</small>
                            <strong>{getGroupMessageViewerNames(msg).slice(0,5).join(', ')}{getGroupMessageViewerNames(msg).length > 5 ? ` +${getGroupMessageViewerNames(msg).length - 5}` : ''}</strong>
                          </div>
                        )}
                        {canEditMessage && (
                          <>
                            <button className="message-menu-item" onClick={() => beginEditMessage(msg)}>
                              <span className="message-menu-item-icon"><FiEdit2 className="ui-icon" /></span>
                              <span>Edit</span>
                            </button>
                            <button className="message-menu-item delete" onClick={() => handleDeleteMessage(msg._id)}>
                              <span className="message-menu-item-icon"><FiTrash2 className="ui-icon" /></span>
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                        <button
                          className="message-menu-item"
                          onClick={() => {
                            openForwardModal(msg);
                          }}
                        >
                          <span className="message-menu-item-icon"><FiShare2 className="ui-icon" /></span>
                          <span>Forward</span>
                        </button>
                        {!msg.isDeleted && (
                          <>
                            <button className="message-menu-item" onClick={() => handleReactionToggle(msg._id, 'like')}>
                              <span className="message-menu-item-icon"><FiThumbsUp className="ui-icon" /></span>
                              <span>{currentReaction === 'like' ? 'Remove Like' : 'Like'}</span>
                            </button>
                            <button className="message-menu-item" onClick={() => handleReactionToggle(msg._id, 'dislike')}>
                              <span className="message-menu-item-icon"><FiThumbsDown className="ui-icon" /></span>
                              <span>{currentReaction === 'dislike' ? 'Remove Dislike' : 'Dislike'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <div className="message-meta">
                      <small>{formatTime(msg.timestamp)}</small>
                      {msg.editedAt && <small>Edited</small>}
                      {isOwnMessage && (
                        <span
                          className={`message-status ${msg.status || 'sent'}`}
                          title={
                            msg.status === 'read'
                              ? 'Seen'
                              : msg.status === 'delivered'
                                ? 'Delivered'
                                : 'Sent'
                          }
                          aria-label={
                            msg.status === 'read'
                              ? 'Seen'
                              : msg.status === 'delivered'
                                ? 'Delivered'
                                : 'Sent'
                          }
                        >
                          {renderMessageStatusIcon(msg.status || 'sent')}
                        </span>
                      )}
                    </div>
                    {/* 'Seen by' is now shown in the message inline menu (three-dot popup) only */}
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
                    <button className="draft-remove" type="button" onClick={() => setDraftAttachments((prev) => prev.filter((entry) => entry._id !== attachment._id))}>
                      <FiX className="ui-icon" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {draftSticker && (
              <div className="draft-sticker">
                <span>{draftSticker}</span>
                <button className="draft-remove" type="button" onClick={() => setDraftSticker('')}>
                  <FiX className="ui-icon" />
                </button>
              </div>
            )}

            <div className="composer-toolbar">
              <div className="picker-anchor">
             
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
                        <FiX className="ui-icon" />
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
                          <FiSmile className="ui-icon" />
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
                          <FiPaperclip className="ui-icon" />
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
                          <FiImage className="ui-icon" />
                          <small>Photo</small>
                        </button>
                        <button
                          className="picker-action-tile"
                          onClick={handleShareLocation}
                          disabled={sharingLocation}
                        >
                          <FiMapPin className="ui-icon" />
                          <small>{sharingLocation ? 'Sharing...' : 'Location'}</small>
                        </button>
                        <button
                          className={`picker-action-tile ${voiceRecordingState.active ? 'recording' : ''}`}
                          onClick={voiceRecordingState.active ? stopVoiceRecording : startVoiceRecording}
                          disabled={uploading}
                        >
                          {voiceRecordingState.active ? <FiStopCircle className="ui-icon" /> : <FiMic className="ui-icon" />}
                          <small>{voiceRecordingState.active ? 'Stop Voice' : 'Voice Note'}</small>
                        </button>
                      </div>
                    ) : (
                      <>
                        {emojiGroups.map((group) => (
                          <div key={group.label}>
                            <div className="picker-popup-section">
                              <strong>{group.label}</strong>
                            </div>
                            <div className="picker-panel">
                              {group.emojis.map((emoji) => (
                                <button
                                  key={`${group.label}-${emoji}`}
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
                          </div>
                        ))}
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
              {(uploading || sharingLocation || voiceRecordingState.active) && (
                <span className={`upload-status ${voiceRecordingState.active ? 'recording' : ''}`}>
                  {uploading
                    ? 'Uploading...'
                    : voiceRecordingState.active
                      ? `Recording voice message ${formatRecordingTime(voiceRecordingState.durationSeconds)}`
                      : 'Sharing location...'}
                </span>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleAttachmentSelection(e.target.files)} />
              <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => handleAttachmentSelection(e.target.files)} />
            </div>

            <div className="composer composer-with-mentions">
              {mentionState.open && mentionSuggestions.length > 0 && (
                <div className="mention-popup">
                  {mentionSuggestions.map((member, index) => (
                    <button
                      key={member._id}
                      type="button"
                      className={`mention-option ${index === Math.min(mentionState.selectedIndex, mentionSuggestions.length - 1) ? 'active' : ''}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        insertMention(member);
                      }}
                    >
                      <strong>@{member.username}</strong>
                      <small>{member.email || 'Group member'}</small>
                    </button>
                  ))}
                </div>
              )}

              <div className="input-with-icons">
                <button
                  type="button"
                  className="icon-left ghost-button"
                  onClick={() => setShowComposerPopup((prev) => !prev)}
                  title="Open emoji and attachments"
                  aria-label="Open emoji and attachments"
                >
                  <FiSmile className="ui-icon" />
                </button>

                <input
                  ref={messageInputRef}
                  value={message}
                  onChange={(e) => sendTypingEvent(e.target.value)}
                  onClick={(e) => updateMentionStateForValue(e.target.value, e.target.selectionStart)}
                  onKeyDown={(e) => {
                    if (mentionState.open && mentionSuggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setMentionState((prev) => ({
                          ...prev,
                          selectedIndex: Math.min(prev.selectedIndex + 1, mentionSuggestions.length - 1)
                        }));
                        return;
                      }

                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setMentionState((prev) => ({
                          ...prev,
                          selectedIndex: Math.max(prev.selectedIndex - 1, 0)
                        }));
                        return;
                      }

                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        insertMention(mentionSuggestions[Math.min(mentionState.selectedIndex, mentionSuggestions.length - 1)]);
                        return;
                      }

                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setMentionState({ open: false, query: '', startIndex: -1, endIndex: -1, selectedIndex: 0 });
                        return;
                      }
                    }

                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Type a message"
                />

                <div className="input-icons-right">
                  <button
                    type="button"
                    className="ghost-button icon-button"
                    onClick={() => photoInputRef.current?.click()}
                    title="Attach photo"
                    aria-label="Attach photo"
                  >
                    <FiImage className="ui-icon" />
                  </button>
                  <button
                    type="button"
                    className="ghost-button icon-button "
                    onClick={handleSendMessage}
                    disabled={uploading || voiceRecordingState.active}
                    title="Send message"
                    aria-label="Send message"
                  >
                    <FiSend className="ui-icon" />
                  </button>
                </div>
              </div>
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

      {incomingGroupCall && (
        <div className="call-banner">
          <div>
            <strong>{incomingGroupCall.groupName}</strong>
            <span>{incomingGroupCall.caller.username} started a {incomingGroupCall.type} group call</span>
          </div>
          <div className="group-actions">
            <button className="ghost-button" onClick={acceptGroupCall}>Join</button>
            <button className="danger-button" onClick={rejectGroupCall}>Dismiss</button>
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

      {groupCallState && (
        <div className="call-modal-scrim">
          <div className="call-modal-card">
            <div className="call-panel">
              <div className="call-panel-header">
                <div>
                  <strong>{groupCallState.type === 'video' ? 'Group Video Call' : 'Group Voice Call'}</strong>
                  <span>
                    {groupCallState.phase === 'ringing' && `Calling ${groupCallState.groupName}...`}
                    {groupCallState.phase === 'connecting' && 'Joining group call...'}
                    {groupCallState.phase === 'connected' && `${groupCallParticipants.length} participants connected`}
                  </span>
                </div>
                <div className="call-inline-actions">
                  <button className="ghost-button" onClick={toggleMicrophone}>
                    {isMicEnabled ? 'Mute' : 'Unmute'}
                  </button>
                  {groupCallState.type === 'video' && (
                    <button className="ghost-button" onClick={toggleCamera}>
                      {isCameraEnabled ? 'Camera Off' : 'Camera On'}
                    </button>
                  )}
                  <button className="danger-button" onClick={endCall}>
                    {groupCallState.hostId === user._id ? 'End' : 'Leave'}
                  </button>
                </div>
              </div>

              <div className={`call-media-grid ${groupCallState.type === 'voice' ? 'voice-only' : ''}`}>
                {groupCallParticipants.map((participant) => (
                  <StreamTile
                    key={participant._id}
                    stream={participant.stream}
                    mode={groupCallState.type}
                    muted={participant.isLocal}
                    label={participant.isLocal ? 'You' : participant.username}
                    avatarLabel={getInitials(participant.username || 'Member')}
                    accent={!participant.isLocal}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {(callState || incomingCall || incomingGroupCall) && <audio ref={remoteAudioRef} autoPlay playsInline className="sr-only-media" />}

      {showGroupMemberPicker && (
        <div className="modal-scrim" onClick={() => setShowGroupMemberPicker(false)}>
          <div className="modal-card group-picker-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Select People</h3>
                <p>Choose the connections you want to add to this group.</p>
              </div>
              <button className="modal-close" onClick={() => setShowGroupMemberPicker(false)}>
                <FiX className="ui-icon" />
              </button>
            </div>
            <div className="group-picker-modal-body">
              {connections.length > 0 ? (
                <div className="contact-picker group-picker-list">
                  {connections.map((entry) => (
                    <label key={entry._id} className="picker-option picker-option-card">
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
                      <div className="picker-option-copy">
                        <strong>{entry.username}</strong>
                        <span>{entry.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="empty-state slim">No connections available to add yet.</div>
              )}
            </div>
            <div className="group-picker-modal-actions">
              <span className="status-label pending">{groupDraft.members.length} selected</span>
              <button className="ghost-button" type="button" onClick={() => setShowGroupMemberPicker(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
                <FiX className="ui-icon" />
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

      {showGroupMembersModal && activeChat?.group && (
        <div className="modal-scrim" onClick={() => setShowGroupMembersModal(false)}>
          <div className="modal-card group-members-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Group Members</h3>
                <p>Everyone currently in {activeChat.name}.</p>
              </div>
              <button className="modal-close" onClick={() => setShowGroupMembersModal(false)}>
                <FiX className="ui-icon" />
              </button>
            </div>
            <div className="group-members-modal-list">
              {(activeChat.members || []).map((member) => (
                <div key={member._id || member} className="group-member-row">
                  <div>
                    <strong>{member.username || 'Member'}</strong>
                    <small>{member._id === activeChat.admin?._id ? 'Admin' : member.online ? 'Online' : 'Member'}</small>
                  </div>
                  {isGroupAdmin && member._id !== user._id && member._id !== activeChat.admin?._id && (
                    <button className="danger-button" type="button" onClick={() => handleRemoveMember(member._id)}>
                      Remove Member
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddMembersModal && activeChat?.group && (
        <div className="modal-scrim" onClick={() => setShowAddMembersModal(false)}>
          <div className="modal-card group-picker-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Add Members</h3>
                <p>Select connections to add to this group.</p>
              </div>
              <button className="modal-close" onClick={() => setShowAddMembersModal(false)}>
                <FiX className="ui-icon" />
              </button>
            </div>
            {groupActionError && <div className="auth-error">{groupActionError}</div>}
            <div className="group-picker-modal-body">
              {availableMembersToAdd.length > 0 ? (
                <div className="contact-picker group-picker-list">
                  {availableMembersToAdd.map((entry) => (
                    <label key={entry._id} className="picker-option picker-option-card">
                      <input
                        type="checkbox"
                        checked={memberIdsToAdd.includes(entry._id)}
                        onChange={() =>
                          setMemberIdsToAdd((prev) =>
                            prev.includes(entry._id) ? prev.filter((id) => id !== entry._id) : [...prev, entry._id]
                          )
                        }
                      />
                      <div className="picker-option-copy">
                        <strong>{entry.username}</strong>
                        <span>{entry.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="empty-state slim">No more connections available to add.</div>
              )}
            </div>
            <div className="group-picker-modal-actions">
              <span className="status-label pending">{memberIdsToAdd.length} selected</span>
              <button className="ghost-button" type="button" onClick={handleAddMembers}>
                Add Members
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameGroupModal && activeChat?.group && (
        <div className="modal-scrim" onClick={() => setShowRenameGroupModal(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Change Group Name</h3>
                <p>Update the group details for all members.</p>
              </div>
              <button className="modal-close" onClick={() => setShowRenameGroupModal(false)}>
                <FiX className="ui-icon" />
              </button>
            </div>
            {groupActionError && <div className="auth-error">{groupActionError}</div>}
            <form className="modal-form" onSubmit={handleRenameGroup}>
              <input
                value={renameGroupDraft.name}
                onChange={(event) => setRenameGroupDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Group name"
                required
              />
              <input
                value={renameGroupDraft.description}
                onChange={(event) => setRenameGroupDraft((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Description"
              />
              <button type="submit">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      <div className={`quick-fab-stack ${quickActionsOpen ? 'expanded' : 'collapsed'}`}>
        {quickActionsOpen && (
          <div className="quick-fab-actions">
            <button className="people-fab" type="button" onClick={() => navigate('/people')}>
              <span><FiUsers className="ui-icon" /></span>
              <strong>People</strong>
            </button>
            {appConfig.features?.status && (
              <button className="status-fab" type="button" onClick={() => navigate('/status')}>
                <span><FiPlus className="ui-icon" /></span>
                <strong>Status</strong>
              </button>
            )}
            <AgentFab />
          </div>
        )}
        <button
          className="quick-fab-toggle"
          type="button"
          aria-expanded={quickActionsOpen}
          aria-label={quickActionsOpen ? 'Collapse quick actions' : 'Expand quick actions'}
          onClick={() => setQuickActionsOpen((current) => !current)}
        >
          <span>{quickActionsOpen ? <FiX className="ui-icon" /> : <FiMoreVertical className="ui-icon" />}</span>
          <strong>{quickActionsOpen ? '' : ''}</strong>
        </button>
      </div>
    </div>
  );
}

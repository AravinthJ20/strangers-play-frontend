client/                      # React Frontend
│   ├── public/
│   └── src/
│       ├── assets/              # Static assets (images, icons)
│       ├── components/          # Reusable UI components
│       │   ├── common/          # Buttons, Modal, Input, Avatar
│       │   ├── feed/            # PostCard, CreatePost, FeedList
│       │   ├── messaging/       # ChatWindow, MessageItem, CallOverlay
│       │   ├── requests/        # ConnectionRequestList, RequestCard
│       │   └── ai/              # AI Agent UI
│       │       ├── AgentChatWindow.jsx
│       │       ├── AgentMessage.jsx
│       │       ├── ToolCallBadge.jsx
│       │       └── ActionSuggestChips.jsx
│       ├── context/             # Global states
│       │   ├── AuthContext.jsx
│       │   ├── SocketContext.jsx
│       │   └── CallContext.jsx
│       ├── hooks/               # Custom hooks
│       │   ├── useAuth.js
│       │   ├── useSocket.js
│       │   ├── useWebRTC.js     # Voice/Video calls
│       │   └── useAgentChat.js  # AI chat & streaming logic
│       ├── pages/               # Top-level views
│       │   ├── FeedPage.jsx
│       │   ├── MessagingPage.jsx
│       │   ├── RequestsPage.jsx
│       │   └── AgentAssistantPage.jsx
│       ├── services/            # API & socket handlers
│       │   ├── api.js           # Axios/Fetch client
│       │   ├── chatService.js
│       │   ├── callService.js
│       │   └── agentService.js  # Endpoint calls to backend AI
│       ├── utils/               # Formatters, constants, validators
│       ├── App.jsx
│       └── main.jsx
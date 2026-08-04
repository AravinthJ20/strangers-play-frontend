import axios from 'axios';
import { appConfig } from '../config';

const client = axios.create({ baseURL: appConfig.apiBaseUrl, headers: { 'Content-Type': 'application/json' } });
const withAuth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const loginUser = (credentials) => client.post('/api/auth/login', credentials).then((res) => res.data);
export const requestRegistrationOtp = (payload) => client.post('/api/auth/register/request-otp', payload).then((res) => res.data);
export const registerUser = (payload) => client.post('/api/auth/register', payload).then((res) => res.data);
export const requestPasswordResetOtp = (email) => client.post('/api/auth/forgot-password/request-otp', { email }).then((res) => res.data);
export const resetPassword = (payload) => client.post('/api/auth/forgot-password/reset', payload).then((res) => res.data);
export const sendInviteEmail = (email, token) => client.post('/api/auth/invite', { email }, withAuth(token)).then((res) => res.data);
export const validateInviteToken = (inviteToken) => client.get(`/api/auth/invite/${inviteToken}`).then((res) => res.data);
export const logoutUser = (token) => client.post('/api/auth/logout', {}, withAuth(token)).then((res) => res.data);
export const getCurrentUser = (token) => client.get('/api/auth/me', withAuth(token)).then((res) => res.data);
export const fetchChatList = (token) => client.get('/api/chat/chats', withAuth(token)).then((res) => res.data);
export const fetchContacts = (token) => client.get('/api/users', withAuth(token)).then((res) => res.data);
export const fetchConnections = (token) => client.get('/api/users/connections', withAuth(token)).then((res) => res.data);
export const fetchProfile = (token) => client.get('/api/users/profile', withAuth(token)).then((res) => res.data);
export const updateProfile = (payload, token) => client.patch('/api/users/profile', payload, withAuth(token)).then((res) => res.data);
export const activatePremium = (token) => client.post('/api/users/premium/activate', {}, withAuth(token)).then((res) => res.data);
export const fetchDiscoverPeople = (token) => client.get('/api/users/discover', withAuth(token)).then((res) => res.data);
export const fetchFeed = (token) => client.get('/api/users/feed', withAuth(token)).then((res) => res.data);
export const fetchPremiumInsights = (token) => client.get('/api/users/premium/insights', withAuth(token)).then((res) => res.data);
export const fetchPremiumRecommendations = (token) => client.get('/api/users/premium/recommendations', withAuth(token)).then((res) => res.data);
export const fetchConnectionRequests = (token) => client.get('/api/users/requests', withAuth(token)).then((res) => res.data);
export const fetchRequests = (token) => client.get('/api/users/requests', withAuth(token)).then((res) => res.data);
export const searchUsers = (query, token) => client.get(`/api/users/search?query=${encodeURIComponent(query)}`, withAuth(token)).then((res) => res.data);
export const subscribeToPush = (subscription, token) => client.post('/api/users/push/subscribe', { subscription }, withAuth(token)).then((res) => res.data);
export const unsubscribeFromPush = (endpoint, token) => client.post('/api/users/push/unsubscribe', { endpoint }, withAuth(token)).then((res) => res.data);
export const sendConnectionRequest = (userId, token) => client.post(`/api/users/connections/${userId}/request`, {}, withAuth(token)).then((res) => res.data);
export const sendInterest = (userId, token) => client.post(`/api/users/connections/${userId}/request`, {}, withAuth(token)).then((res) => res.data);
export const ignoreUser = (userId, token) => client.post(`/api/users/connections/${userId}/ignore`, {}, withAuth(token)).then((res) => res.data);
export const acceptConnectionRequest = (userId, token) => client.post(`/api/users/connections/${userId}/accept`, {}, withAuth(token)).then((res) => res.data);
export const acceptInterest = (userId, token) => client.post(`/api/users/connections/${userId}/accept`, {}, withAuth(token)).then((res) => res.data);
export const rejectConnectionRequest = (userId, token) => client.post(`/api/users/connections/${userId}/reject`, {}, withAuth(token)).then((res) => res.data);
export const rejectInterest = (userId, token) => client.post(`/api/users/connections/${userId}/reject`, {}, withAuth(token)).then((res) => res.data);
export const fetchMessages = (userId, token, options = {}) =>
  client
    .get(`/api/chat/messages/${userId}`, {
      ...withAuth(token),
      params: {
        limit: options.limit,
        before: options.before
      }
    })
    .then((res) => res.data);
export const editMessage = (messageId, content, token) => client.patch(`/api/chat/messages/${messageId}`, { content }, withAuth(token)).then((res) => res.data);
export const deleteMessage = (messageId, token) => client.delete(`/api/chat/messages/${messageId}`, withAuth(token)).then((res) => res.data);
export const reactToMessage = (messageId, value, token) => client.post(`/api/chat/messages/${messageId}/reactions`, { value }, withAuth(token)).then((res) => res.data);
export const fetchStatusFeed = (token) => client.get('/api/status', withAuth(token)).then((res) => res.data);
export const fetchMyStatuses = (token) => client.get('/api/status/mine', withAuth(token)).then((res) => res.data);
export const createStatus = (payload, token) => client.post('/api/status', payload, withAuth(token)).then((res) => res.data);
export const deleteStatus = (statusId, token) => client.delete(`/api/status/${statusId}`, withAuth(token)).then((res) => res.data);
export const markStatusViewed = (statusId, token) => client.patch(`/api/status/${statusId}/view`, {}, withAuth(token)).then((res) => res.data);
export const fetchGroups = (token) => client.get('/api/groups', withAuth(token)).then((res) => res.data);
export const fetchGroupDetails = (groupId, token) => client.get(`/api/groups/${groupId}`, withAuth(token)).then((res) => res.data);
export const fetchGroupMessages = (groupId, token, options = {}) =>
  client
    .get(`/api/groups/${groupId}/messages`, {
      ...withAuth(token),
      params: {
        limit: options.limit,
        before: options.before
      }
    })
    .then((res) => res.data);
export const uploadChatMedia = (payload, token) => client.post('/api/chat/uploads', payload, withAuth(token)).then((res) => res.data);
export const createGroup = (payload, token) => client.post('/api/groups', payload, withAuth(token)).then((res) => res.data);
export const updateGroup = (groupId, payload, token) => client.patch(`/api/groups/${groupId}`, payload, withAuth(token)).then((res) => res.data);
export const addGroupMembers = (groupId, memberIds, token) => client.post(`/api/groups/${groupId}/add-members`, { memberIds }, withAuth(token)).then((res) => res.data);
export const removeGroupMember = (groupId, memberId, token) => client.post(`/api/groups/${groupId}/remove-member`, { memberId }, withAuth(token)).then((res) => res.data);
export const leaveGroup = (groupId, token) => client.post(`/api/groups/${groupId}/leave`, {}, withAuth(token)).then((res) => res.data);
export const fetchAgentCapabilities = (token) => client.get('/api/agent/capabilities', withAuth(token)).then((res) => res.data);
export const sendAgentMessage = (message, token) => client.post('/api/agent/chat', { message }, withAuth(token)).then((res) => res.data);

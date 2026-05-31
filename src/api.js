import axios from 'axios';
import { appConfig } from './config';

const client = axios.create({ baseURL: appConfig.apiBaseUrl, headers: { 'Content-Type': 'application/json' } });
const withAuth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const loginUser = (credentials) => client.post('/api/auth/login', credentials).then((res) => res.data);
export const registerUser = (payload) => client.post('/api/auth/register', payload).then((res) => res.data);
export const sendInviteEmail = (email, token) => client.post('/api/auth/invite', { email }, withAuth(token)).then((res) => res.data);
export const validateInviteToken = (inviteToken) => client.get(`/api/auth/invite/${inviteToken}`).then((res) => res.data);
export const logoutUser = (token) => client.post('/api/auth/logout', {}, withAuth(token)).then((res) => res.data);
export const getCurrentUser = (token) => client.get('/api/auth/me', withAuth(token)).then((res) => res.data);
export const fetchChatList = (token) => client.get('/api/chat/chats', withAuth(token)).then((res) => res.data);
export const fetchContacts = (token) => client.get('/api/users', withAuth(token)).then((res) => res.data);
export const fetchConnectionRequests = (token) => client.get('/api/users/requests', withAuth(token)).then((res) => res.data);
export const searchUsers = (query, token) => client.get(`/api/users/search?query=${encodeURIComponent(query)}`, withAuth(token)).then((res) => res.data);
export const sendConnectionRequest = (userId, token) => client.post(`/api/users/connections/${userId}/request`, {}, withAuth(token)).then((res) => res.data);
export const acceptConnectionRequest = (userId, token) => client.post(`/api/users/connections/${userId}/accept`, {}, withAuth(token)).then((res) => res.data);
export const rejectConnectionRequest = (userId, token) => client.post(`/api/users/connections/${userId}/reject`, {}, withAuth(token)).then((res) => res.data);
export const fetchMessages = (userId, token) => client.get(`/api/chat/messages/${userId}`, withAuth(token)).then((res) => res.data);
export const fetchGroups = (token) => client.get('/api/groups', withAuth(token)).then((res) => res.data);
export const fetchGroupMessages = (groupId, token) => client.get(`/api/groups/${groupId}/messages`, withAuth(token)).then((res) => res.data);
export const uploadChatMedia = (payload, token) => client.post('/api/chat/uploads', payload, withAuth(token)).then((res) => res.data);
export const createGroup = (payload, token) => client.post('/api/groups', payload, withAuth(token)).then((res) => res.data);
export const addGroupMembers = (groupId, memberIds, token) => client.post(`/api/groups/${groupId}/add-members`, { memberIds }, withAuth(token)).then((res) => res.data);
export const leaveGroup = (groupId, token) => client.post(`/api/groups/${groupId}/leave`, {}, withAuth(token)).then((res) => res.data);

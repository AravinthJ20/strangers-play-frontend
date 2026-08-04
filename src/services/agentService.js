import { fetchAgentCapabilities, sendAgentMessage } from './api';

export const getAgentCapabilities = (token) => fetchAgentCapabilities(token);
export const postAgentMessage = (message, token) => sendAgentMessage(message, token);

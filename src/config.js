const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://strangers-play-backend.onrender.com';

export const appConfig = {
  apiBaseUrl,
  socketUrl: process.env.REACT_APP_SOCKET_URL || apiBaseUrl,
  mediaBaseUrl: process.env.REACT_APP_MEDIA_BASE_URL || apiBaseUrl
};

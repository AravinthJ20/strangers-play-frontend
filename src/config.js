const configuredApiUrl = process.env.REACT_APP_API_URL;
const browserLocalApiUrl = "http://localhost:4000";
const productionApiUrl = "/backend";
const apiUrl =
  configuredApiUrl ||
  (window.location.hostname === "localhost" ? browserLocalApiUrl : productionApiUrl);

export const appConfig = {
  apiBaseUrl: apiUrl,
  socketUrl: apiUrl,
  mediaBaseUrl: apiUrl,

  socketOptions:
    apiUrl === productionApiUrl ? { path: "/backend/socket.io" } : {},

  vapidPublicKey:
    "BESZWDQRyJyEgRow94uzdVWVKhOUAo460urAwdaFYhhHYQoqWdDfrZj1ZriG7G0mPrl0bZQkiBrBTUw0D3dCtNI",

  supportEmail: 'support@greenlynk.xyz',
  features: {
    status: true,
    agent: true,
  },
};

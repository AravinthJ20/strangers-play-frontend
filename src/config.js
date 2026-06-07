export const appConfig = {
  // apiBaseUrl: 'http://localhost:4000/',
  // socketUrl: 'http://localhost:4000',
  // mediaBaseUrl: 'http://localhost:4000',
    apiBaseUrl: process.env.REACT_APP_API_URL,
  socketUrl:  process.env.REACT_APP_API_URL,
  mediaBaseUrl:  process.env.REACT_APP_API_URL,
  vapidPublicKey: 'BESZWDQRyJyEgRow94uzdVWVKhOUAo460urAwdaFYhhHYQoqWdDfrZj1ZriG7G0mPrl0bZQkiBrBTUw0D3dCtNI',
  features: {
    status: true
  }
};

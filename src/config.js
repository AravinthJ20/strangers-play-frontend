


// export const appConfig = {
//   apiBaseUrl: process.env.REACT_APP_API_URL || 'https://greenlynk.xyz/backend/',
//   socketUrl: process.env.REACT_APP_API_URL || 'https://nextgenops.xyz/backend',
//   mediaBaseUrl: process.env.REACT_APP_API_URL || 'https://nextgenops.xyz/backend',
//   vapidPublicKey: 'BESZWDQRyJyEgRow94uzdVWVKhOUAo460urAwdaFYhhHYQoqWdDfrZj1ZriG7G0mPrl0bZQkiBrBTUw0D3dCtNI',
//   features: {
//     status: true
//   }
// };



export const appConfig = {
  apiBaseUrl:
    window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "/backend",

  socketUrl:
    window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "/backend",

  mediaBaseUrl:
    window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "/backend",

  socketOptions:
    window.location.hostname === "localhost"
      ? {}
      : { path: "/backend/socket.io" },

  vapidPublicKey:
    "BESZWDQRyJyEgRow94uzdVWVKhOUAo460urAwdaFYhhHYQoqWdDfrZj1ZriG7G0mPrl0bZQkiBrBTUw0D3dCtNI",

  features: {
    status: true,
  },
};
/**
 * Copy to config.js for local overrides, or use as reference for CI-generated config.
 */
(function () {
  const GOOGLE_CLIENT_ID = 'your-google-oauth-client-id.apps.googleusercontent.com';
  const CAPACITOR_API_BASE_URL = 'https://your-app.azurewebsites.net/api';

  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isNative = Boolean(window.Capacitor?.isNativePlatform?.());

  let apiBaseUrl = 'http://localhost:3000/api';

  if (isNative && CAPACITOR_API_BASE_URL.trim()) {
    apiBaseUrl = CAPACITOR_API_BASE_URL.trim().replace(/\/$/, '');
  } else if (!isLocal) {
    apiBaseUrl = `${window.location.origin}/api`;
  }

  window.ONCE_METROS_CONFIG = {
    GOOGLE_CLIENT_ID,
    API_BASE_URL: apiBaseUrl,
    CAPACITOR_API_BASE_URL,
  };
})();

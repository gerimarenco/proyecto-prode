/**
 * Runtime config for Once Metros.
 * - Local web (localhost): API at http://localhost:3000/api
 * - Hosted web (Vercel / SWA): same-origin /api (proxied in vercel.json or staticwebapp.config.json)
 * - Capacitor native: uses CAPACITOR_API_BASE_URL (direct to App Service; no Vercel proxy)
 */
(function () {
  const GOOGLE_CLIENT_ID =
    '636175972249-ep1bv8bifo5a0j1m9nrdtp0ljlr2pajv.apps.googleusercontent.com';

  /** Direct App Service URL for Capacitor (not used in the browser on Vercel). */
  const CAPACITOR_API_BASE_URL =
    'https://once-metros-api-gzhrhka4d4gac3cq.chilecentral-01.azurewebsites.net/api';

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

const splitList = (value) => String(value ?? '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

// STUN is fine for direct connections; TURN is required when either peer is
// behind a symmetric NAT or a restrictive firewall. Dead public TURN servers
// are intentionally not hardcoded — configure a real one via env vars.
const stunServers = splitList(import.meta.env.VITE_STUN_URLS).map((urls) => ({ urls }));

const staticTurnServer = {
  urls: splitList(import.meta.env.VITE_TURN_URLS),
  username: import.meta.env.VITE_TURN_USERNAME ?? '',
  credential: import.meta.env.VITE_TURN_CREDENTIAL ?? '',
};

const fallbackConfig = {
  iceServers: [
    ...(stunServers.length ? stunServers : [{ urls: 'stun:stun.l.google.com:19302' }]),
    ...(staticTurnServer.urls.length ? [staticTurnServer] : []),
  ],
};

// Providers such as Metered expose a publishable API key that returns a fresh
// iceServers array. Fetching it at runtime keeps credentials rotatable.
const credentialsUrl = import.meta.env.VITE_TURN_CREDENTIALS_URL ?? '';
let cachedConfig = null;

export async function getIceConfig() {
  if (!credentialsUrl) return fallbackConfig;
  if (cachedConfig) return cachedConfig;

  try {
    const response = await fetch(credentialsUrl);
    const servers = await response.json();
    if (Array.isArray(servers) && servers.length) {
      cachedConfig = { iceServers: servers };
      return cachedConfig;
    }
    console.error('TURN credentials endpoint returned no ICE servers');
  } catch (err) {
    console.error('Could not fetch TURN credentials', err);
  }

  return fallbackConfig;
}

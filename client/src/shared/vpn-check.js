import { api_url } from './config';

const normalizeIp = (value) => String(value ?? '')
  .trim()
  .replace(/^::ffff:/i, '')
  .replace(/^\[|\]$/g, '')
  .toLowerCase();

// Only public IPv4 addresses are comparable: STUN usually returns IPv4 while
// a site may be reached over IPv6, and loopback/private addresses say nothing
// about a VPN. Comparing those would produce false positives.
const isPublicIpv4 = (ip) => {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip ?? '')) return false;
  const [a, b] = ip.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  return true;
};

// The public IP the page used for HTTP(S).
const getHttpIp = async () => {
  try {
    const response = await fetch(`${api_url}/ip`, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return normalizeIp(data.ip);
  } catch {
    return null;
  }
};

// The public IP WebRTC reveals via STUN. When a VPN leaks WebRTC traffic,
// this differs from the HTTP IP — a strong signal that a VPN/proxy is active.
const getStunIp = () => new Promise((resolve) => {
  if (typeof RTCPeerConnection === 'undefined') {
    resolve(null);
    return;
  }

  let connection;
  let settled = false;
  const finish = (value) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    try { connection?.close(); } catch { /* already closed */ }
    resolve(value);
  };
  const timer = setTimeout(() => finish(null), 5000);

  try {
    connection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    connection.createDataChannel('vpn-check');

    connection.onicecandidate = ({ candidate }) => {
      if (candidate?.type !== 'srflx') return;
      const match = candidate.candidate.match(/^candidate:\S+ \d+ \S+ \d+ (\S+) \d+ typ srflx/);
      if (match) finish(normalizeIp(match[1]));
    };
    connection.onicegatheringstatechange = () => {
      if (connection.iceGatheringState === 'complete') finish(null);
    };

    connection.createOffer()
      .then((offer) => connection.setLocalDescription(offer))
      .catch(() => finish(null));
  } catch {
    finish(null);
  }
});

export async function detectVpn() {
  const [httpIp, stunIp] = await Promise.all([getHttpIp(), getStunIp()]);
  // Only report a mismatch when both are known, public IPv4 addresses. STUN can
  // be blocked, and IPv6/IPv4 egress can legitimately differ, so silence or an
  // incomparable address is not a detection.
  return Boolean(
    isPublicIpv4(httpIp) && isPublicIpv4(stunIp) && httpIp !== stunIp
  );
}

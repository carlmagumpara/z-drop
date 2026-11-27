// In development the Vite dev server is separate from Express (:4000).
// On Vercel the client and the Socket.IO function share one origin.
const isDev = import.meta.env.DEV;

export const base_url = import.meta.env.VITE_API_ORIGIN ?? (isDev ? 'http://localhost:4000' : '');

export const api_url = `${base_url}${import.meta.env.VITE_API_PATH ?? (isDev ? '/api' : '/api/server')}`;

export const socket_path = import.meta.env.VITE_SOCKET_PATH ?? (isDev ? '/socket.io' : '/api/server/');

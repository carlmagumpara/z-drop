// One server serves both the client and the API. The Vite dev server runs on a
// different port, so only development needs an explicit origin.
const isDev = import.meta.env.DEV;

export const base_url = import.meta.env.VITE_API_ORIGIN ?? (isDev ? 'http://localhost:4000' : '');

export const api_url = `${base_url}${import.meta.env.VITE_API_PATH ?? '/api'}`;

export const socket_path = import.meta.env.VITE_SOCKET_PATH ?? '/socket.io';

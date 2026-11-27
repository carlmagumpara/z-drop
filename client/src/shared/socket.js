import { io } from 'socket.io-client';
import { base_url, socket_path } from './config';

export const socket = io(base_url || undefined, {
  withCredentials: true,
  // Vercel Functions cannot do sticky long-polling sessions.
  transports: ['websocket'],
  path: socket_path,
});

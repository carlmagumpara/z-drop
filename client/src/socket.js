import { io } from 'socket.io-client';

export const socket = io("https://fs-server-ze6q.onrender.com", {
  withCredentials: true,
});
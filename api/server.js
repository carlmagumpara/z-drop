import { createHttpServer } from '../app.js';

// Vercel Functions are killed at max duration; Socket.IO clients reconnect.
export const config = {
  maxDuration: 300,
};

const server = createHttpServer();

// The Vercel Node runtime detects an http.Server export by intercepting listen().
server.listen();

export default server;

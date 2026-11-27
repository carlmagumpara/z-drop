import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';
import { Server } from 'socket.io';
import cors from 'cors';
import * as store from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 4000;

const defaultOrigins = ['http://localhost:5173', 'http://localhost:4000'];
const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsConfig = {
  origin: configuredOrigins.length ? configuredOrigins : defaultOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

// One server owns every route, so Socket.IO can use its default path.
const socketPath = process.env.SOCKET_PATH || '/socket.io';

function roomFromClient(payload, room_id) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.room_id && String(payload.room_id) !== String(room_id)) return null;

  const room = { room_id: String(room_id) };
  for (const field of ['name', 'password', 'owner_id']) {
    if (typeof payload[field] === 'string') room[field] = payload[field];
  }
  return room;
}

function broadcastRoomUsers(io, roomId) {
  const clients = io.sockets.adapter.rooms.get(roomId);
  const users = [];

  if (clients) {
    for (const clientId of clients) {
      const clientSocket = io.sockets.sockets.get(clientId);
      if (clientSocket) {
        users.push([clientSocket.data.user_id, clientSocket.data.username, clientId]);
      }
    }
  }

  io.to(roomId).emit('room-users', users);
}

function registerSockets(io) {
  const onlineUsers = new Map(); // user_id -> socket.id

  io.on('connection', socket => {
    console.log('User connected:', socket.id);

    socket.on('files-counter', () => {
      io.emit('total_files', store.incrementFiles());
    });

    socket.on('user_online', ({ user_id, username } = {}) => {
      if (!user_id) return;

      onlineUsers.set(user_id, socket.id);
      store.markUserOnline(user_id);
      console.log(`${username ?? user_id} is online`);

      io.emit('total_files', store.getFilesCount());
      io.emit('total_users', store.getUserCount());
      io.emit('update_users', Array.from(onlineUsers.keys()));
    });

    socket.on('join-room', ({ room_id, password, user_id, username, room: clientRoom, private: isPrivate } = {}) => {
      if (!room_id) return;

      let room = store.getRoom(room_id);

      // Rooms are in-memory only. Recreate one from the client's copy (or from
      // the room's public/private marker) so shared links survive a cold start.
      if (!room) {
        const restored = roomFromClient(clientRoom, room_id);

        if (restored) {
          room = store.createRoom(restored);
        } else if (isPrivate) {
          if (!password) {
            socket.emit('room-status', {
              data: {},
              message: 'Please enter room password',
              status: 'enter-password',
            });
            return;
          }
          room = store.createRoom({ room_id, name: '', password, owner_id: '' });
        } else {
          room = store.createRoom({ room_id, name: '', password: '', owner_id: '' });
        }
      }

      if (room.password && room.owner_id !== user_id && !store.hasRoomAccess(user_id, room_id)) {
        if (!password) {
          socket.emit('room-status', {
            data: {},
            message: 'Please enter room password',
            status: 'enter-password',
          });
          return;
        }

        if (room.password !== password) {
          socket.emit('room-status', {
            data: {},
            message: 'Wrong password!',
            status: 'wrong-password',
          });
          return;
        }

        store.grantRoomAccess(user_id, room_id);
      }

      console.log(`${username ?? user_id} joined room: ${room_id}`);
      socket.join(room_id);
      socket.data.username = username;
      socket.data.user_id = user_id;

      socket.emit('room-status', {
        data: room,
        message: 'Joining success',
        status: 'success',
      });
      socket.to(room_id).emit('joined', {
        user_id,
        username,
        socket_id: socket.id,
      });

      broadcastRoomUsers(io, room_id);
    });

    socket.on('leave-room', ({ room_id, user_id, username } = {}) => {
      socket.leave(room_id);
      console.log(`${username ?? user_id} left room: ${room_id}`);
      socket.to(room_id).emit('left', { user_id, username });
      broadcastRoomUsers(io, room_id);
    });

    socket.on('on-message', ({ room_id, type, data } = {}) => {
      if (!room_id) return;

      io.to(room_id).emit('message', { type, data });

      if (type === 'message') {
        store.addMessage(room_id, data);
      }

      if (type === 'read') {
        store.updateMessage(room_id, data?.message_id, message => ({
          ...message,
          readers: [...(message.readers ?? []), data],
        }));
      }

      if (type === 'react') {
        store.updateMessage(room_id, data?.message_id, message => {
          const reactions = message.reactions ?? [];
          const existing = reactions.find(item => item.user_id === data.user_id);

          if (!existing) {
            return { ...message, reactions: [...reactions, data] };
          }

          if (existing.emoji === data.emoji) {
            return { ...message, reactions: reactions.filter(item => item.user_id !== data.user_id) };
          }

          return {
            ...message,
            reactions: reactions.map(item => item.user_id === data.user_id ? data : item),
          };
        });
      }
    });

    socket.on('offer', data => {
      socket.to(data.to).emit('offer', { from: socket.id, sdp: data.sdp });
    });

    socket.on('answer', data => {
      socket.to(data.to).emit('answer', { from: socket.id, sdp: data.sdp });
    });

    socket.on('ice-candidate', data => {
      socket.to(data.to).emit('ice-candidate', { from: socket.id, candidate: data.candidate });
    });

    socket.on('disconnect', () => {
      const roomsLeft = [...socket.rooms].filter(room => room !== socket.id);

      for (const roomId of roomsLeft) {
        broadcastRoomUsers(io, roomId);
      }

      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`${userId} went offline`);
          io.emit('update_users', Array.from(onlineUsers.keys()));
          break;
        }
      }
    });
  });
}

export function createApp() {
  const app = express();

  app.use(cors(corsConfig));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const api = express.Router();

  const health = (req, res) => {
    res.json({ ok: true, stats: store.getStats() });
  };

  const create = (payload, res) => {
    try {
      const room = store.createRoom(payload);
      res.json({ data: room, message: 'Room Created!' });
    } catch (error) {
      res.status(400).json({ data: {}, message: error.message });
    }
  };

  const history = (room_id, res) => {
    res.json({
      data: store.getMessages(room_id),
      message: 'Messages fetched!',
    });
  };

  api.get('/health', health);
  api.post('/create-room', (req, res) => create(req.body ?? {}, res));
  api.get('/messages/:room_id', (req, res) => history(req.params.room_id, res));

  app.use('/api', api);

  // The same server serves the built client and handles client-side routing.
  // Hashed assets can be cached forever; index.html must revalidate so clients
  // pick up the newest hashed JS/CSS URLs after each deploy.
  const distDir = join(__dirname, 'client', 'dist');
  const noCache = (res) => res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  app.use(express.static(distDir, {
    setHeaders(res, filePath) {
      if (basename(filePath) === 'index.html') {
        noCache(res);
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));
  app.get(/(.*)/, (req, res) => {
    noCache(res);
    res.sendFile(join(distDir, 'index.html'));
  });

  return app;
}

export function createHttpServer() {
  const server = createServer(createApp());
  const io = new Server(server, {
    cors: corsConfig,
    path: socketPath,
  });

  registerSockets(io);
  return server;
}

// This is the single entry point for local runs and for Vercel.
const server = createHttpServer();

// Vercel's runtime calls listen() on the exported server itself. Only bind a
// port when this file is started directly (local `npm start`).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  server.listen(port, () => console.log(`zDrop server listening on port ${port}`));
}

export default server;

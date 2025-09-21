import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from 'redis';
import { Server } from 'socket.io';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const redis = createClient({ 
  url: 'rediss://red-d361o3umcj7s73abuvmg:W9sA7l54Rhnuh3burt7TAafEaVUReEPk@oregon-keyvalue.render.com:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Too many retries. Giving up.');
        return new Error('Retry limit reached');
      }

      console.log(`Reconnecting attempt #${retries}...`);

      return Math.min(retries * 100, 3000);
    }
  }
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.on('reconnecting', () => console.log('Redis client is reconnecting...'));
redis.on('ready', () => console.log('Redis client is ready.'));
redis.on('end', () => console.log('Redis client is end.'));

redis.connect();

const corsConfig = {
  origin: ["http://localhost:5173", "http://localhost:4000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsConfig
});

const port = process.env.PORT || 4000;

let onlineUsers = new Map();

app.use(cors(corsConfig));
app.use(express.static(join(__dirname, "client", "dist")));

app.post('/api/create-room', async (req, res) => {
  const body = req.body;

  await redis.hSet(`room:${body.room_id}`, {
    ...body,
    created_at: Date.now()
  });
  const room = await redis.hGetAll(`room:${body.room_id}`);

  res.json({
    data: room,
    message: "Room Created!",
  });
});

app.get(/(.*)/, (req, res, next) => {
  res.sendFile(join(__dirname, "client", "dist", "index.html"));
});

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  socket.on("files-counter", async (data) => {
    await redis.incr("files:counter");
    const files = await redis.get("files:counter");
    io.emit("total_files", files);
  });

  socket.on("user_online", async ({ user_id, username }) => {
    onlineUsers.set(user_id, socket.id);
    console.log(`${username} is online`);
    await redis.sAdd("users", user_id);
    const users = await redis.sMembers("users");
    const files = await redis.get("files:counter");

    io.emit("total_files", files);
    io.emit("total_users", users.length);
    io.emit("update_users", Array.from(onlineUsers.keys()));
  });

  // socket.on("create-room", async ({ room_id, name, password, owner_id }) => {
  //   await redis.hSet(`room:${room_id}`, {
  //     room_id,
  //     name,
  //     password, 
  //     owner_id,
  //     created_at: Date.now()
  //   });
  //   const room = await redis.hGetAll(`room:${room_id}`);
  //   socket.emit("room-status", {
  //     data: room,
  //     message: "Room Created!",
  //     status: "room-created"
  //   });
  //   console.log(`Room created: ${room_id}:${password}`);
  // });

  socket.on("join-room", async ({ room_id, password, user_id, username }) => {
    const room = await redis.hGetAll(`room:${room_id}`);

    console.log('room', room);

    if(!room) {
      socket.emit("room-status", {
        data: {},
        message: "Room not found!",
        status: "not-found"
      });
      return;
    }

    if(room?.password && !room?.owner_id !== user_id) {
      if(!password) {
        socket.emit("room-status", {
          data: {},
          message: "Please enter room password",
          status: "enter-password"
        });

        return;
      }
      
      if(room.password !== password) {
        socket.emit("room-status", {
          data: {},
          message: "Wrong password!",
          status: "wrong-password"
        });

        return;
      }
    }

    console.log(`${username} joined room: ${room_id}`);
    socket.join(room_id);
    // check room if theres a password
    socket.emit("room-status", {
      data: room,
      message: "Joining success",
      status: "success"
    });
    // if success
    socket.to(room_id).emit("joined", {
      user_id, 
      username,
      socket_id: socket.id
    });
    socket.data.username = username;
    socket.data.user_id = user_id;
    const messages = await redis.lRange(`chat:messages-${room_id}`, 0, -1);
    const clients = io.sockets.adapter.rooms.get(room_id);
    const users = [];

    if (clients) {
      for (const clientId of clients) {
        const clientSocket = io.sockets.sockets.get(clientId);
        users.push([clientSocket.data.user_id, clientSocket.data.username, clientId]);
      }
    }

    io.to(room_id).emit("room-users", users);
    socket.emit("chat-history", messages.map((m) => JSON.parse(m)));
  });

  socket.on("leave-room", ({ room_id, user_id, username }) => {
    socket.leave(room_id);
    console.log(`${username} left room: ${room_id}`);
    socket.to(room_id).emit("left", { user_id, username });
  });

  socket.on("on-message", async ({ room_id, type, data }) => {
    io.to(room_id).emit("message", {
      type,
      data,
    });

    if(type === 'message') {
      await redis.rPush(`chat:messages-${room_id}`, JSON.stringify(data));
    }

    if(type === 'read') {
      const messages = await redis.lRange(`chat:messages-${room_id}`, 0, -1);

      const index = messages.findIndex(message=> {
        const parsed = JSON.parse(message);
        return parsed.id === data.message_id;
      });

      if (index !== -1) {
        const updated = JSON.parse(messages[index]);

        updated.readers = [
          ...(updated.readers ?? []),
          data
        ];
        await redis.lSet(
          `chat:messages-${room_id}`, 
          index, 
          JSON.stringify(updated)
        );
      };
    }

    if(type === 'react') {
      const messages = await redis.lRange(`chat:messages-${room_id}`, 0, -1);

      const index = messages.findIndex(message=> {
        const parsed = JSON.parse(message);
        return parsed.id === data.message_id;
      });

      if (index !== -1) {
        const updated = JSON.parse(messages[index]);
        const reactions = updated.reactions ?? [];

        if(!reactions.some(item => item.user_id === data.user_id)) {
          updated.reactions = [
            ...reactions, 
            data
          ];
        } else {
          const react = reactions.find(item => item.user_id === data.user_id);
          if(react.emoji === data.emoji) {
            updated.reactions = reactions.filter(item => item.user_id !== data.user_id);
          } else {
            updated.reactions = reactions.map(item => item.user_id === data.user_id ? data : item);
          }
        }

        await redis.lSet(
          `chat:messages-${room_id}`, 
          index, 
          JSON.stringify(updated)
        );
      };
    }
  });

  socket.on("offer", (data) => {
    socket.to(data.to).emit("offer", { 
      from: socket.id, 
      sdp: data.sdp 
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.to).emit("answer", { 
      from: socket.id, 
      sdp: data.sdp 
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.to).emit("ice-candidate", { 
      from: socket.id, 
      candidate: data.candidate 
    });
  });

  socket.on("disconnect", () => {
    console.log('a user disconnect');

    let userId = null;

    for (let [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        userId = uid;
        onlineUsers.delete(uid);
        break;
      }
    }

    if (userId) {
      console.log(`${userId} went offline`);
      io.emit("update_users", Array.from(onlineUsers.keys()));
    }
  });
});

server.listen(port, () => console.log(`Example app listening on port ${port}`));
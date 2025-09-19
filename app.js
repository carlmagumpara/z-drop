import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from 'redis';
import { Server } from 'socket.io';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = createClient({ 
  url: 'rediss://red-d361o3umcj7s73abuvmg:W9sA7l54Rhnuh3burt7TAafEaVUReEPk@oregon-keyvalue.render.com:6379' 
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();

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

app.get(/(.*)/, (req, res, next) => {
  res.sendFile(join(__dirname, "client", "dist", "index.html"));
});

io.on('connection', (socket) => {

  console.log("User connected:", socket.id);

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

  socket.on("join-room", async ({ roomId, username }) => {
    socket.join(roomId);
    console.log(`${username} joined room: ${roomId}`);
    // socket.to(roomId).emit("joined", [username, socket.id]);
    io.in(roomId).emit("joined", [username, socket.id]);
  
    socket.data.username = username;
    const messages = await client.lRange(`chat:messages-${roomId}`, 0, -1);
    const clients = io.sockets.adapter.rooms.get(roomId);
    const users = [];

    if (clients) {
      for (const clientId of clients) {
        const clientSocket = io.sockets.sockets.get(clientId);
        users.push([clientSocket.data.username, clientId]);
      }
    }

    io.to(roomId).emit("room-users", users);
    socket.emit("chat-history", messages.map((m) => JSON.parse(m)));
  });

  socket.on("leave-room", ({ roomId, username }) => {
    socket.leave(roomId);
    console.log(`${username} left room: ${roomId}`);
    socket.to(roomId).emit("left", username);
  });

  socket.on("on-message", async ({ roomId, type, data }) => {
    io.to(roomId).emit("message", {
      type,
      data,
    });

    if(type === 'message') {
      await client.rPush(`chat:messages-${roomId}`, JSON.stringify(data));
    }

    // if(type === 'read') {
    //   const messages = await client.lRange(`chat:messages-${roomId}`, 0, -1);

    //   const index = messages.findIndex(message=> {
    //     const parsed = JSON.parse(message);
    //     return parsed.id === data.data.message_id;
    //   });

    //   if (index !== -1) {
    //     const updated = JSON.parse(messages[index]);

    //     updated.readBy = [
    //       ...updated.readBy,
    //       data.data.username
    //     ];
    //     await client.lSet(
    //       `chat:messages-${roomId}`, 
    //       index, 
    //       JSON.stringify(updated)
    //     );
    //   };
    // }
  });

  socket.on("user_online", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`${userId} is online`);
    io.emit("update_users", Array.from(onlineUsers.keys()));
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
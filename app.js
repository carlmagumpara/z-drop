import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://fs-client-x6so.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const port = process.env.PORT || 4000;

let onlineUsers = new Map();

app.use(cors({
  origin: ["http://localhost:5173", "https://fs-client-x6so.onrender.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.get('/', (req, res) => {
  res.send({
    message: 'Server is working!'
  });
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

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);
    console.log(`${username} joined room: ${roomId}`);
    socket.to(roomId).emit("joined", [username, socket.id]);
    socket.data.username = username;
    const clients = io.sockets.adapter.rooms.get(roomId);
    const users = [];

    if (clients) {
      for (const clientId of clients) {
        const clientSocket = io.sockets.sockets.get(clientId);
        users.push([clientSocket.data.username, clientId]);
      }
    }

    io.to(roomId).emit("room-users", users);
  });

  socket.on("leave-room", ({ roomId, username }) => {
    socket.leave(roomId);
    console.log(`${username} left room: ${roomId}`);
    socket.to(roomId).emit("left", username);
  });

  socket.on("on-message", ({ roomId, type, data }) => {
    io.to(roomId).emit("message", {
      type,
      data,
    });
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

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
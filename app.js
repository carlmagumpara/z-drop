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
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const port = process.env.PORT || 4000;

let onlineUsers = new Map();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('Server is working!');
});

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user_online", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`${userId} is online`);
    io.emit("update_users", Array.from(onlineUsers.keys()));
  });

  socket.on("join-room", (roomName) => {
    socket.join(roomName);
    console.log(`${socket.id} joined room: ${roomName}`);
    
    socket.to(roomName).emit("message", `${socket.id} joined the room`);
  });

  socket.on("on-message", ({ roomName, message }) => {
    io.to(roomName).emit("message", message);
  });

  socket.on("leave-room", (roomName) => {
    socket.leave(roomName);
    console.log(`${socket.id} left room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log('a user disconnect');

    let userId = null;

    // Hanapin kung aling user ang naka-bind sa socket
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
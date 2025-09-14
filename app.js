import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 4000;

const corsOptions = {
  origin: ['http://localhost:5173']
};

let onlineUsers = new Map();

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.send('Hello World!')
})

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on("user_online", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`${userId} is online`);
    io.emit("update_users", Array.from(onlineUsers.keys()));
  });

  socket.on("disconnect", () => {
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
})
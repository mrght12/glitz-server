const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const users = new Map();

app.get('/', (req, res) => {
  res.send('Glitz Server Running!');
});

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('join', (username) => {
    users.set(socket.id, username);
    io.emit('notification', {
      text: `${username} joined`,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('sendMessage', (text) => {
    const username = users.get(socket.id) || 'Guest';
    io.emit('newMessage', {
      id: Date.now().toString(),
      text: text,
      username: username,
      senderId: socket.id,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
  });
});

server.listen(3000, () => {
  console.log('Glitz server on port 3000');
});

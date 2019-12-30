/*
NVG Chat
server.js
*/

const express = require('express');
const server = express();
const http = require('http').createServer(server);
const io = require('socket.io')(http);
const dotenv = require('dotenv');

dotenv.config();

const port = process.env.PORT;

server.use(express.static('public'));

server.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
});

http.listen(port, () => {
  console.log('listening on *:' + port);
});

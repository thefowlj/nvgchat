/*
NVG Chat
server.js
*/

const express = require('express');
const server = express();
const http = require('http').createServer(server);
const io = require('socket.io')(http);
const dotenv = require('dotenv');
const db = require('diskdb');

dotenv.config();
const port = process.env.PORT;

server.use(express.static('public'));

// Ensure the databases are empty when server starts
db.connect('db', ['currentUsers','messages']);
db.currentUsers.remove();
db.messages.remove();

// Connect to db directory and create JSON files
db.connect('db', ['currentUsers','messages']);

server.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  let newUserId;
  console.log('a user connected');
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
  socket.on('newUser', (dataObj) => {
    newUser = db.currentUsers.save(dataObj);
    console.log(`${newUser.uname} created`);
    newUserId = newUser._id;
    io.emit('newUserConnected', newUser.uname);
  });
  socket.on('disconnect', (reason) => {
    let uname = db.currentUsers.find({_id: newUserId})[0].uname;
    console.log(`${uname} deleted`);
    db.currentUsers.remove({_id: newUserId});
    io.emit('userDisconnected', uname);
  });
});

http.listen(port, () => {
  console.log('listening on *:' + port);
});

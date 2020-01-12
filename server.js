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

/*
  message json format:
  {
    uid: uid,
    uname: uname,
    color: uColor,
    type: msg or announce
    message: $('#m').val()
  }
*/

io.on('connection', (socket) => {
  let newUserId;
  console.log('a user connected');
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg.message);
    db.messages.save(msg);
    io.emit('chat message', msg);
  });
  socket.on('newUser', (dataObj) => {
    newUser = db.currentUsers.save(dataObj);
    console.log(`${newUser.uname} created`);
    newUserId = newUser._id;
    socket.emit('newUserId', newUserId);
    socket.emit('allMessages', db.messages.find());
    //io.emit('newUserConnected', newUser.uname);
    let connectMsg = {
      uid: newUserId,
      uname: newUser.uname,
      color: '#000000',
      type: 'announce',
      message: `${newUser.uname} has entered the chat.`
    }
    db.messages.save(connectMsg);
    io.emit('chat message', connectMsg);
  });
  socket.on('disconnect', (reason) => {
    let user = db.currentUsers.find({_id: newUserId})[0];
    if(user != undefined) {
      let uname = db.currentUsers.find({_id: newUserId})[0].uname;
      console.log(`${uname} deleted`);
      db.currentUsers.remove({_id: newUserId});
      let disconnectMsg = {
        uid: newUserId,
        uname: uname,
        color: '#000000',
        type: 'announce',
        message: `${newUser.uname} has left the chat.`
      }
      db.messages.save(disconnectMsg);
      io.emit('chat message', disconnectMsg);
    }
  });
});

http.listen(port, () => {
  console.log('listening on *:' + port);
});

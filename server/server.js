/*
NVG Chat
server.js
*/

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

const express = require('express');
const server = express();
const http = require('http').createServer(server);
const io = require('socket.io')(http);
const dotenv = require('dotenv');
const mongoUtil = require('./mongoUtil');
const colors = require('./colors');

dotenv.config();
const port = process.env.PORT;

server.use(express.static('public'));

var mdb;    // mongodb reference
var currentUsers;   // currentUsers collection from mongodb
var messages;   // messages collection from mongodb
mongoUtil.connectToServer((err) => {
    if (err) throw err;
    mdb = mongoUtil.getDb();
    mdb.listCollections().toArray((err, items) => {
        console.log(items);

        // start from scratch on server startup and remove any existing collections
        items.filter((x) => {
            mdb.collection(x.name).drop((err, delOK) => {
                if (err) throw err;
                if (delOK) console.log('collection deleted');
            });
            return null;
        });
    });

    // create reference for collections
    currentUsers = mdb.collection('currentUsers');
    messages = mdb.collection('messages');
});

// new client connection
io.on('connection', (socket) => {
    let newUserId;
    console.log('a user connected');
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg.message);

        mdb.collection('messages').insertOne(msg, (err, res) => {
            if (err) throw err;
            console.log(res);
        });

        io.emit('chat message', msg);
    });

    // new user has been sent to server
    socket.on('newUser', (dataObj) => {
        currentUsers.insertOne(dataObj, (err, res) => {
            if (err) throw err;

            // send client a generated color if one is not specified
            if (dataObj.color == undefined) {
                dataObj.color = colors.getRandomHexColor();
                socket.emit('newUserColor', dataObj.color);
            }
            console.log(res);
            console.log(`${dataObj.uname} created`);
            newUserId = res.insertedId; // new user id created during mongodb insertion
            socket.emit('newUserId', newUserId);

            // send all existing messages to new client
            socket.emit('allMessages', messages.find({}).toArray((err, results) => {
                if (err) throw err;
                socket.emit('allMessages', results);
                io.emit('newUserConnected', dataObj.uname);
                let connectMsg = {
                    uid: newUserId,
                    uname: dataObj.uname,
                    color: '#000000',
                    type: 'announce',
                    message: `${dataObj.uname} has entered the chat.`
            }
            mdb.collection('messages').insertOne(connectMsg, (err, res) => {
                if (err) throw err;
                console.log(res);
            });
            io.emit('chat message', connectMsg);
            }));

            
        });
        console.log(dataObj);

        // create disconnect process for new user
        socket.on('disconnect', (reason) => {
            currentUsers.find({ _id: newUserId }).toArray((err, result) => {
                if (err) throw err;
                let user = result[0];
                console.log(user);
                if (user != undefined) {
                    let uname = user.uname;
                    
                    // delete user from mongodb
                    currentUsers.deleteOne({ _id: newUserId }, (err, obj) => {
                        if (err) throw err;
                        console.log(`${uname} deleted`);
                        let disconnectMsg = {
                            uid: newUserId,
                            uname: uname,
                            color: '#000000',
                            type: 'announce',
                            message: `${uname} has left the chat.`
                        }

                        // disconnect message
                        messages.insertOne(disconnectMsg, (err, res) => {
                            if (err) throw err;
                            console.log(res);
                            io.emit('chat message', disconnectMsg);
                        });
                    });
                }
            });

        });
    });

});

// root route to return index.html
server.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// starting server
http.listen(port, () => {
    console.log('listening on *:' + port);
});

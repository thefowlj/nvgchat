/*
NVG Chat
nvgchat.js
*/
let uid;
let uname;
let uColor = null;

$(document).ready(() => {
    let socket = io();

    uColor = getRandomHexColor();
    console.log(uColor);

    $('#messagesContainer').hide();

    $('#username').on('submit', function (e) {
        e.preventDefault();
        uname = $('#un').val();
        $('#initial').hide();
        //$('#messagesContainer').show();
        //$('.chatForm').show();

        $('#chatUsername').text(uname);
        $('#chatUsername').css('color', uColor);
        $('#messagesContainer').css('display', 'flex');
        $('#messagesContainer').css('height', '100%');

        let newUser = { uname: uname, color: uColor };
        socket.emit('newUser', newUser);
        $(document).scrollTop($(document).height());
        $('#m').focus();
        return false;
    });

    $('.chatForm').submit(function (e) {
        e.preventDefault();
        socket.emit(
            'chat message',
            {
                uid: uid,
                uname: uname,
                color: uColor,
                type: 'msg',
                message: $('#m').val()
            }
        );
        $('#m').val('');
        return false;
    });
    socket.on('newUserId', (id) => {
        uid = id;
    });
    socket.on('chat message', function (msg) {
        processMsg(msg);
    });
    socket.on('allMessages', (messages) => {
        for (let i = 0; i < messages.length; i++) {
            processMsg(messages[i]);
        }
    })
});

function processMsg(msg) {
    let output = '';
    if (msg.type == 'msg') {
        output =
            `<li><span style='color: ${msg.color}'>${msg.uname}:
    </span>${msg.message}</li>`;
    } else if (msg.type == 'announce') {
        output = `<li>${msg.message}</li>`;
    }
    $('#messages').append(output);
    $(document).scrollTop($(document).height());
}

// https://stackoverflow.com/questions/1152024/best-way-to-generate-a-random-color-in-javascript/14187677#14187677
function getRandomHexColor(brightness) {
    brightness = brightness == undefined ? 75 : brightness;
    function randomChannel(brightness) {
        let r = 255 - brightness;
        let n = 0 | ((Math.random() * r) + brightness);
        let s = n.toString(16);
        return (s.length == 1) ? '0' + s : s;
    }
    return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
}

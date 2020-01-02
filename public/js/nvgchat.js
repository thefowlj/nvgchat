/*
NVG Chat
nvgchat.js
*/
var uname;
var uColor = 'null';

$(document).ready(() => {
  var socket = io();

  uColor = getRandomHexColor();
  console.log(uColor);

  $('#messagesContainer').hide();

  $('#username').on('submit', function(e) {
    e.preventDefault();
    uname = $('#un').val();
    $('#initial').hide();
    //$('#messagesContainer').show();
    //$('.chatForm').show();

    $('#chatUsername').text(uname);
    $('#chatUsername').css('color', uColor);
    $('#messagesContainer').css('display', 'flex');
    $('#messagesContainer').css('height', '100%');

    var newUser = { uname: uname, color: uColor };
    socket.emit('newUser', newUser);
    $(document).scrollTop($(document).height());
    $('#m').focus();
    return false;
  });

  $('.chatForm').submit(function(e){
    e.preventDefault();
    socket.emit(
      'chat message',
      {
        uname: uname,
        color: uColor,
        message: $('#m').val()
      }
    );
    $('#m').val('');
    return false;
  });
  socket.on('chat message', function(msg){
    var msgText = msg.message;
    var color = msg.color;
    var uname = msg.uname;
    $('#messages').append(`<li><span style='color: ${color}'>${uname}: </span>${msgText}</li>`);
    $(document).scrollTop($(document).height());
  });
});

// https://stackoverflow.com/questions/1152024/best-way-to-generate-a-random-color-in-javascript/14187677#14187677
function getRandomHexColor(brightness){
  brightness = brightness == undefined ? 75 : brightness;
  function randomChannel(brightness){
    var r = 255-brightness;
    var n = 0|((Math.random() * r) + brightness);
    var s = n.toString(16);
    return (s.length==1) ? '0'+s : s;
  }
  return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
}

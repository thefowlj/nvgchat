/*
NVG Chat
nvgchat.js
*/
var uname;

$(document).ready(() => {
  var socket = io();

  $('.chatForm').hide();

  $('#username').on('submit', function(e) {
    e.preventDefault();
    uname = $('#un').val();
    $('#initial').hide();
    $('#messages').show();
    $('.chatForm').show();
    $('#m').focus();
    $('#chatUsername').text(uname);
    return false;
  });

  $('.chatForm').submit(function(e){
    e.preventDefault();
    socket.emit('chat message', uname + ': ' + $('#m').val());
    $('#m').val('');
    return false;
  });
  socket.on('chat message', function(msg){
    console.log(msg);
    $('#messages').prepend($('<li>').text(msg));
  });
});

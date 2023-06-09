const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let undoList = [];


io.on('connection', (socket)=> {
    console.log('User Online');
    onClear(socket);
})

function onConnection(socket){
    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
    console.log('something')

    socket.on('addLineToUndoList', (line) => {
      undoList.push(line);
      console.log('LINE ADDED', line)
      console.log(undoList.length)
    })
  }

  function onClear(socket) {
    socket.on('clearCanvas', (data) =>  socket.broadcast.emit('clearCanvas', data));
      console.log("cleared");
  }
  
  io.on('connection', onConnection);

  app.get('/api/server', (req, res) => {
    res.send('Socket server is running!');
  });

var server_port = process.env.PORT || 3000;
// http.listen(server_port, () => {
//   console.log("Started on : "+ server_port);
// })

io.listen(server_port, () => {
  console.log("Started on : "+ server_port);
})

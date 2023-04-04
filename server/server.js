
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
// const io = require('socket.io')(server, {
//     cors: {
//       origin: 'http://localhost:3000',
//       methods: ['GET', 'POST']
//     }
//   });
let undoList = [];
// let canvas;

io.on('connection', (socket)=> {
    console.log('User Online');
    onClear(socket);
    // onUndo(socket)
    
    
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
      // io.emit('canvasCleared');
      canvas = null;
  }

  // function onUndo(socket) {
  //   socket.on('undo', ({ previousCanvasState, currentCanvasState }) => {
  //     console.log('CURRENT',currentCanvasState);
  //     console.log('PREV', previousCanvasState)
  //     console.log(undoList.length)
  //     if (undoList.length > 0) {
  //       undoList.pop(); // remove the last state
  //       undoList.push(previousCanvasState); // add the previous canvas state to the undo list
  //       // Send the current canvas state to all users
  //       socket.broadcast.emit('canvasUpdated', currentCanvasState);
  //       console.log('undone!')
  //     }
  //   });
  // }
  
  io.on('connection', onConnection);

var server_port = process.env.YOUR_PORT || process.env.PORT || 4000;
http.listen(server_port, () => {
  console.log("Started on : "+ server_port);
})

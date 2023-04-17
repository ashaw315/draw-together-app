import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let undoList = [];

io.on('connection', (socket) => {
  console.log('User Online');
  onClear(socket);
});

function onConnection(socket) {
  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
  console.log('something');

  socket.on('addLineToUndoList', (line) => {
    undoList.push(line);
    console.log('LINE ADDED', line);
    console.log(undoList.length);
  });
}

function onClear(socket) {
  socket.on('clearCanvas', (data) => socket.broadcast.emit('clearCanvas', data));
  console.log("cleared");
}

io.on('connection', onConnection);

app.get('/api/server', (req, res) => {
    res.send('Socket server is running!');
  });

const server_port = process.env.PORT || 3000;
server.listen(server_port, () => {
  console.log("Started on : " + server_port);
});

export default app;

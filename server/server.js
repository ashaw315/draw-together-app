const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

io.on('connection', (socket) => {
    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
    socket.on('clearCanvas', (data) => socket.broadcast.emit('clearCanvas', data));
});

app.get('/api/server', (req, res) => {
    res.send('Socket server is running!');
});

var server_port = process.env.PORT || 3000;

io.listen(server_port, () => {
    console.log("Started on : " + server_port);
});

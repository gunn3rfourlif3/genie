const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.json());

app.post('/event', (req, res) => {
    // Relay the full payload including advanced metrics
    io.emit('telemetry_update', req.body);
    res.sendStatus(200);
});

http.listen(4001, () => console.log('Bridge relaying on port 4001'));
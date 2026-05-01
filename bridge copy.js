const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { 
    cors: { origin: "*" } 
});

console.log("Starting bridge initialization..."); // If you don't see this, Node is failing to load

app.use(express.json());

// The AI Consumer hits this route
app.post('/event', (req, res) => {
    io.emit('telemetry_update', req.body);
    res.status(200).send('OK');
});

// Basic health check for your browser
app.get('/', (req, res) => {
    res.send('Bridge is alive');
});

http.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error('FATAL: Port 4001 is already in use!');
    } else {
        console.error('Server error:', e);
    }
});

http.listen(4001, '0.0.0.0', () => {
    console.log('------------------------------------');
    console.log('SUCCESS: Bridge running on port 4001');
    console.log('------------------------------------');
});
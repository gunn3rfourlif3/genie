const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Essential for parsing consumer_2.py POST requests

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allows your React app to connect regardless of its port
    methods: ["GET", "POST"]
  }
});

// Change this line in your bridge.js
app.post('/event', (req, res) => {
  const telemetryData = req.body;
  
  // This sends the data to your React App.js
  io.emit('telemetry', telemetryData);
  
  console.log(`Relayed data for Device: ${telemetryData.device_id}`);
  res.status(200).send({ status: 'success' });
});

server.listen(4001, () => {
  console.log('Genie Bridge is LIVE on port 4001');
});

// Add this near the top of bridge.js
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});



require('dotenv').config(); // Load the .env_2 variables
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.post('/event', (req, res) => {
  const telemetryData = req.body;
  io.emit('telemetry', telemetryData);
  console.log(`[${new Date().toLocaleTimeString()}] Relayed: ${telemetryData.device_id}`);
  res.status(200).send({ status: 'success' });
});

app.get('/health', (req, res) => res.status(200).send('Bridge is Healthy'));

// CHANGE THIS LINE: Use the PORT variable from .env_2
const PORT = process.env.PORT || 4001; 

server.listen(PORT, () => {
  console.log(`Genie Bridge LIVE on port ${PORT}`);
});
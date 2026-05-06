const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Socket.io Configuration[cite: 1, 3]
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace "*" with "http://your-domain.com"
    methods: ["GET", "POST"]
  }
});

// Endpoint for consumer_10.py
app.post('/event', (req, res) => {
  const telemetryData = req.body;
  
  // Broadcast to all connected Dashboards[cite: 1, 3]
  io.emit('telemetry', telemetryData);
  
  console.log(`[${new Date().toLocaleTimeString()}] Relayed: ${telemetryData.device_id}`);
  res.status(200).send({ status: 'success' });
});

// Health check for VPS monitoring
app.get('/health', (req, res) => res.status(200).send('Bridge is Healthy'));

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`Genie Bridge LIVE on port ${PORT}`);
});
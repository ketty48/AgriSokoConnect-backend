import { WebSocketServer } from 'ws';

// Create a WebSocket server
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('A new client connected');

  // Handle incoming messages
  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
    // Broadcast to all clients except the sender
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('A client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:8080');

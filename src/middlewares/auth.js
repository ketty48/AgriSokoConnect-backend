wss.on('connection', (ws, req) => {
    const session = req.session;
    
    if (!session || !session.userId) {
      ws.close();
      return;
    }
  
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
  
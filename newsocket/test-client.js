const WebSocket = require('ws');
const NUM_CLIENTS = 100; // Number of test clients
const CONNECT_INTERVAL = 100; // ms between connections

function createTestClient(index) {
    const ws = new WebSocket('ws://localhost:9000');
    
    ws.on('open', () => {
        console.log(`Client ${index} connected`);
        // Simulate login
        ws.send(JSON.stringify({
            type: 'login',
            userId: `user${index}`,
            username: `TestUser${index}`
        }));
    });

    ws.on('message', (data) => {
        console.log(`Client ${index} received:`, data.toString());
    });

    ws.on('close', () => {
        console.log(`Client ${index} disconnected`);
    });

    ws.on('error', (error) => {
        console.error(`Client ${index} error:`, error.message);
    });

    return ws;
}

// Create clients with interval
let connectedClients = 0;
const interval = setInterval(() => {
    if (connectedClients >= NUM_CLIENTS) {
        clearInterval(interval);
        console.log('All test clients connected');
        return;
    }
    createTestClient(connectedClients++);
}, CONNECT_INTERVAL);

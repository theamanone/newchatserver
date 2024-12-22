/**
 * NextChat WebSocket Server Test Suite
 * 
 * This file contains tests to verify the functionality and performance
 * of the WebSocket server. It simulates multiple clients and various
 * message scenarios.
 */

const WebSocket = require('ws');
const os = require('os');

// Test configuration
const TEST_CONFIG = {
    serverUrl: 'ws://localhost:9000',
    numClients: 100,              // Number of test clients to create
    messageInterval: 1000,        // Milliseconds between messages
    testDuration: 60000,         // Test duration in milliseconds
    connectionTimeout: 5000,     // Connection timeout in milliseconds
    logInterval: 5000           // Status logging interval
};

// Test metrics
const metrics = {
    connectedClients: 0,
    failedConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    startTime: Date.now(),
    avgResponseTime: 0
};

// Test scenarios
const scenarios = [
    {
        name: 'Login',
        type: 'login',
        getData: (clientId) => ({
            _id: `user${clientId}`,
            username: `TestUser${clientId}`,
            avatar: `avatar${clientId}.jpg`,
            groupIds: [`group1`, `group2`]
        })
    },
    {
        name: 'Personal Message',
        type: 'message',
        getData: (clientId, targetId) => ({
            receiver: `user${targetId}`,
            content: `Test message from client ${clientId}`,
            timestamp: new Date().toISOString()
        })
    },
    {
        name: 'Group Message',
        type: 'message',
        getData: (clientId) => ({
            groupId: 'group1',
            content: `Group message from client ${clientId}`,
            timestamp: new Date().toISOString()
        })
    }
];

// Client connection pool
const clients = new Map();

// Create test clients
async function createTestClients() {
    console.log(`Creating ${TEST_CONFIG.numClients} test clients...`);

    for (let i = 0; i < TEST_CONFIG.numClients; i++) {
        try {
            const ws = new WebSocket(TEST_CONFIG.serverUrl);
            
            ws.on('open', () => {
                metrics.connectedClients++;
                clients.set(i, ws);
                
                // Login the client
                sendMessage(ws, scenarios[0], i);
                
                console.log(`Client ${i} connected successfully`);
            });

            ws.on('message', (data) => {
                metrics.messagesReceived++;
                const message = JSON.parse(data);
                handleResponse(message, i);
            });

            ws.on('error', (error) => {
                metrics.errors++;
                console.error(`Client ${i} error:`, error.message);
            });

            ws.on('close', () => {
                metrics.connectedClients--;
                console.log(`Client ${i} disconnected`);
            });

        } catch (error) {
            metrics.failedConnections++;
            console.error(`Failed to create client ${i}:`, error.message);
        }
    }
}

// Send test messages
function sendTestMessages() {
    clients.forEach((ws, clientId) => {
        if (ws.readyState === WebSocket.OPEN) {
            // Randomly select a scenario (excluding login)
            const scenarioIndex = 1 + Math.floor(Math.random() * (scenarios.length - 1));
            const scenario = scenarios[scenarioIndex];
            
            // For personal messages, select a random recipient
            const targetId = Math.floor(Math.random() * TEST_CONFIG.numClients);
            
            sendMessage(ws, scenario, clientId, targetId);
            metrics.messagesSent++;
        }
    });
}

// Send a single message
function sendMessage(ws, scenario, clientId, targetId = null) {
    const data = scenario.getData(clientId, targetId);
    const message = {
        type: scenario.type,
        data: data
    };
    
    try {
        ws.send(JSON.stringify(message));
    } catch (error) {
        metrics.errors++;
        console.error(`Error sending message from client ${clientId}:`, error.message);
    }
}

// Handle server responses
function handleResponse(message, clientId) {
    switch (message.type) {
        case 'login_response':
            console.log(`Client ${clientId} login response:`, message.success);
            break;
        case 'message':
            // Calculate response time
            const responseTime = Date.now() - new Date(message.data.timestamp).getTime();
            metrics.avgResponseTime = (metrics.avgResponseTime + responseTime) / 2;
            break;
        case 'error':
            metrics.errors++;
            console.error(`Error response for client ${clientId}:`, message.data);
            break;
    }
}

// Log test metrics
function logMetrics() {
    const runtime = (Date.now() - metrics.startTime) / 1000;
    console.log('\n=== Test Metrics ===');
    console.log(`Runtime: ${runtime.toFixed(2)} seconds`);
    console.log(`Connected Clients: ${metrics.connectedClients}`);
    console.log(`Failed Connections: ${metrics.failedConnections}`);
    console.log(`Messages Sent: ${metrics.messagesSent}`);
    console.log(`Messages Received: ${metrics.messagesReceived}`);
    console.log(`Errors: ${metrics.errors}`);
    console.log(`Average Response Time: ${metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`Messages/Second: ${(metrics.messagesSent / runtime).toFixed(2)}`);
    console.log('===================\n');
}

// Main test execution
async function runTest() {
    console.log('Starting WebSocket server test...');
    console.log(`Server URL: ${TEST_CONFIG.serverUrl}`);
    console.log(`Test Duration: ${TEST_CONFIG.testDuration / 1000} seconds\n`);

    // Create test clients
    await createTestClients();

    // Wait for clients to connect
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.connectionTimeout));

    // Start sending test messages
    const messageInterval = setInterval(sendTestMessages, TEST_CONFIG.messageInterval);
    const metricsInterval = setInterval(logMetrics, TEST_CONFIG.logInterval);

    // End test after duration
    setTimeout(() => {
        clearInterval(messageInterval);
        clearInterval(metricsInterval);
        
        // Final metrics
        logMetrics();
        
        // Cleanup
        clients.forEach(ws => ws.close());
        console.log('\nTest completed.');
        process.exit(0);
    }, TEST_CONFIG.testDuration);
}

// Run the test
runTest().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});

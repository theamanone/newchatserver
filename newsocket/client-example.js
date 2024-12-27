/**
 * NextChat WebSocket Client Example
 * A simple example showing how to use the NextChat WebSocket server
 */

class NextChatClient {
    constructor(url = 'ws://localhost:9000') {
        this.url = url;
        this.ws = null;
        this.connected = false;
        this.messageQueue = [];
        this.eventHandlers = new Map();
        
        // Bind methods
        this.connect = this.connect.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('Connected to server');
            this.connected = true;
            this.processMessageQueue();
            this.emit('connected');
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.connected = false;
            this.emit('disconnected');
            // Implement reconnection logic
            setTimeout(this.connect, 5000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
    }

    // Event handling
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    // Message handling
    send(type, data) {
        const message = JSON.stringify({ type, data });
        
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            this.messageQueue.push(message);
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.connected) {
            const message = this.messageQueue.shift();
            this.ws.send(message);
        }
    }

    handleMessage(message) {
        const { type, data } = message;
        this.emit(type, data);
    }

    // Authentication
    login(userId, username, avatar = '') {
        this.send('login', {
            _id: userId,
            username,
            avatar
        });
    }

    // Messaging
    sendMessage(receiverId, content, messageType = 'text') {
        this.send('message', {
            receiver: receiverId,
            messageContent: content,
            messageType,
            timestamp: new Date().toISOString()
        });
    }

    sendGroupMessage(groupId, content, messageType = 'text') {
        this.send('message', {
            groupId,
            messageContent: content,
            messageType,
            timestamp: new Date().toISOString()
        });
    }

    // Status updates
    updateOnlineStatus(isOnline) {
        this.send('online_status', { isOnline });
    }

    markMessageAsSeen(messageId, senderId) {
        this.send('messageSeen', { messageId, senderId });
    }

    // Group operations
    joinGroup(groupId) {
        this.send('joinGroup', { groupId });
    }

    // Message interactions
    sendReaction(messageId, reaction) {
        this.send('reaction', { messageId, reaction });
    }

    editMessage(messageId, newContent) {
        this.send('editMessage', { messageId, newContent });
    }

    deleteMessage(messageId) {
        this.send('deleteMessage', { messageId });
    }

    // File handling
    sendFile(receiverId, filePath, fileType) {
        this.send('file', {
            receiver: receiverId,
            filePath,
            fileType,
            timestamp: new Date().toISOString()
        });
    }

    // Cleanup
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Usage example
const chat = new NextChatClient();

// Event listeners
chat.on('connected', () => {
    console.log('Connected to chat server');
    chat.login('user123', 'John Doe');
});

chat.on('message', (data) => {
    console.log('Received message:', data);
});

chat.on('onlineStatus', (users) => {
    console.log('Online users:', users);
});

// Connect to server
chat.connect();

// Example usage
setTimeout(() => {
    // Send a message
    chat.sendMessage('receiver456', 'Hello!');
    
    // Join a group
    chat.joinGroup('group123');
    
    // Send a group message
    chat.sendGroupMessage('group123', 'Hello group!');
    
    // Update online status
    chat.updateOnlineStatus(true);
}, 2000);

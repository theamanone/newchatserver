# NextChat WebSocket Server - Client Integration Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Connection Setup](#connection-setup)
3. [Available Events](#available-events)
4. [Message Formats](#message-formats)
5. [Example Usage](#example-usage)
6. [Error Handling](#error-handling)

## Getting Started

### Server Connection
```javascript
const ws = new WebSocket('ws://localhost:9000');
```

### Basic Event Listeners
```javascript
ws.onopen = () => {
    console.log('Connected to server');
    // Perform login after connection
    login(userId, username);
};

ws.onclose = () => {
    console.log('Disconnected from server');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleMessage(message);
};
```

## Available Events

### 1. Authentication
```javascript
// Login
function login(userId, username) {
    send('login', {
        _id: userId,
        username: username,
        avatar: 'avatar_url',
        groupIds: ['group1', 'group2']
    });
}
```

### 2. Messaging

#### Personal Messages
```javascript
// Send personal message
function sendPersonalMessage(receiverId, content) {
    send('message', {
        receiver: receiverId,
        messageContent: content,
        messageType: 'text',
        timestamp: new Date().toISOString()
    });
}

// Send file message
function sendFileMessage(receiverId, filePath, fileType) {
    send('file', {
        receiver: receiverId,
        filePath: filePath,
        fileType: fileType,
        timestamp: new Date().toISOString()
    });
}

// Send voice message
function sendVoiceMessage(receiverId, voicePath, duration) {
    send('voiceMessage', {
        receiver: receiverId,
        voicePath: voicePath,
        duration: duration,
        timestamp: new Date().toISOString()
    });
}
```

#### Group Messages
```javascript
// Send group message
function sendGroupMessage(groupId, content) {
    send('message', {
        groupId: groupId,
        messageContent: content,
        messageType: 'text',
        timestamp: new Date().toISOString()
    });
}

// Join group
function joinGroup(groupId) {
    send('joinGroup', {
        groupId: groupId
    });
}
```

### 3. Message Status

#### Message Seen Status
```javascript
function markMessageAsSeen(messageId, senderId) {
    send('messageSeen', {
        messageId: messageId,
        senderId: senderId
    });
}
```

#### Message Delivered Status
```javascript
function markMessageAsDelivered(messageId, senderId) {
    send('messagedeliveredStatus', {
        messageId: messageId,
        senderId: senderId
    });
}
```

### 4. Online Status
```javascript
function updateOnlineStatus(isOnline) {
    send('online_status', {
        isOnline: isOnline
    });
}
```

### 5. Message Interactions

#### Reactions
```javascript
function sendReaction(messageId, reaction) {
    send('reaction', {
        messageId: messageId,
        reaction: reaction
    });
}
```

#### Edit Message
```javascript
function editMessage(messageId, newContent) {
    send('editMessage', {
        messageId: messageId,
        newContent: newContent
    });
}
```

#### Delete Message
```javascript
function deleteMessage(messageId) {
    send('deleteMessage', {
        messageId: messageId
    });
}
```

### 6. Admin Communication
```javascript
// Send message to admin
function sendAdminMessage(content) {
    send('userMessage', {
        messageContent: content,
        messageType: 'text',
        timestamp: new Date().toISOString()
    });
}
```

## Message Formats

### Incoming Message Handler
```javascript
function handleMessage(message) {
    const { type, data } = message;

    switch (type) {
        case 'message':
            handleChatMessage(data);
            break;
        case 'onlineStatus':
            updateUserStatus(data);
            break;
        case 'messageSeen':
            updateMessageStatus(data);
            break;
        case 'reaction':
            handleReaction(data);
            break;
        case 'groupOnlineUsers':
            updateGroupUsers(data);
            break;
        case 'error':
            handleError(data);
            break;
    }
}
```

## Example Usage

### Complete Client Setup Example
```javascript
class ChatClient {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.ws.onopen = () => {
            console.log('Connected to chat server');
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from chat server');
            // Implement reconnection logic here
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    send(type, data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    login(userId, username) {
        this.send('login', {
            _id: userId,
            username: username,
            avatar: 'avatar_url'
        });
    }

    sendMessage(receiverId, content) {
        this.send('message', {
            receiver: receiverId,
            messageContent: content,
            messageType: 'text',
            timestamp: new Date().toISOString()
        });
    }

    // Add other methods as needed
}

// Usage
const chat = new ChatClient('ws://localhost:9000');

// Login after connection
chat.login('user123', 'John Doe');

// Send message
chat.sendMessage('receiver456', 'Hello!');
```

## Error Handling

### Common Error Scenarios
1. Connection Errors
```javascript
ws.onerror = (error) => {
    console.error('Connection error:', error);
    // Implement retry logic
};
```

2. Message Send Failures
```javascript
function safeSend(type, data) {
    try {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, data }));
        } else {
            throw new Error('WebSocket not connected');
        }
    } catch (error) {
        console.error('Send error:', error);
        // Handle error appropriately
    }
}
```

3. Reconnection Logic
```javascript
function setupReconnection() {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectInterval = 5000;

    function reconnect() {
        if (reconnectAttempts < maxReconnectAttempts) {
            setTimeout(() => {
                console.log('Attempting to reconnect...');
                ws = new WebSocket('ws://localhost:9000');
                reconnectAttempts++;
            }, reconnectInterval);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    ws.onclose = () => {
        console.log('Connection closed');
        reconnect();
    };
}
```

## Best Practices

1. Always validate message data before sending
2. Implement proper error handling
3. Use reconnection logic for reliability
4. Handle connection state changes appropriately
5. Implement message queuing for offline scenarios
6. Use proper typing for message content
7. Implement proper cleanup on component unmount

## Performance Considerations

1. Message Size
- Keep message payloads small
- Compress large data when necessary
- Use appropriate data formats

2. Connection Management
- Monitor connection state
- Implement heartbeat mechanism
- Handle reconnections gracefully

3. Error Recovery
- Implement proper error handling
- Use message acknowledgments
- Maintain message queue for failed sends

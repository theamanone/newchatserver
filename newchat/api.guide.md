# Support Messages API Guide

## Authentication
All requests must include the following headers:
- `x-user-id`: User ID in format "applicationname+mobilenumber"
- `x-user-role`: User role ("user", "admin", or "superadmin")
- `x-application-id`: Application ID

## Endpoints

### Get Messages
```http
GET /api/v1/superadmin/messages
```

**Headers:**
```
x-user-id: appname+1234567890
x-user-role: user
x-application-id: app123
```

**Response:**
```json
{
  "messages": [
    {
      "_id": "message_id",
      "sender": "appname+1234567890",
      "senderRole": "user",
      "content": "Hello",
      "messageType": "text",
      "applicationId": "app123",
      "applicationName": "App Name",
      "timestamp": "2024-12-24T07:48:37.000Z",
      "receiver": "admin123",
      "receiverRole": "admin"
    }
  ]
}
```

### Send Message
```http
POST /api/v1/superadmin/messages
```

**Headers:**
```
x-user-id: appname+1234567890
x-user-role: user
x-application-id: app123
Content-Type: application/json
```

**Request Body (Text Message):**
```json
{
  "content": "Hello",
  "receiverId": "admin123"
}
```

**Request Body (File Upload):**
Use `multipart/form-data` with the following fields:
- `content`: Optional message text
- `file`: File to upload
- `receiverId`: ID of the message receiver

**Response:**
```json
{
  "message": {
    "_id": "message_id",
    "sender": "appname+1234567890",
    "senderRole": "user",
    "content": "Hello",
    "messageType": "text",
    "applicationId": "app123",
    "applicationName": "App Name",
    "timestamp": "2024-12-24T07:48:37.000Z",
    "receiver": "admin123",
    "receiverRole": "admin"
  }
}
```

## Message Filtering
- Users can only see their own messages for their application
- Admins can see all messages for their application
- Superadmins can see all messages across all applications

## Error Responses

### Missing Headers
```json
{
  "error": "Missing required headers: x-user-id, x-user-role, x-application-id"
}
```

### Suspended User
```json
{
  "error": "You don't have permission to send messages as you are currently suspended"
}
```

### Missing Content
```json
{
  "error": "Message content or file is required"
}
```

### Server Error
```json
{
  "error": "Failed to fetch messages"
}
```

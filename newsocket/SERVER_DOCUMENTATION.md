# NextChat WebSocket Server Documentation

## Server Specifications

### Hardware Requirements
- **Minimum RAM**: 16GB (Recommended: 32GB)
- **CPU Cores**: 8+ cores recommended
- **Network**: High-bandwidth connection
- **Storage**: SSD recommended for better performance

### Performance Capabilities
- **Connections per Worker**: 100,000
- **Total Connections**: Number of CPU cores × 100,000
  - 4 cores = 400,000 connections
  - 8 cores = 800,000 connections
  - 16 cores = 1,600,000 connections

### Connection Limits
- **Max Connections per IP**: 20
- **Connection Backlog**: 50,000
- **Connection Timeout**: 10 minutes
- **Max Payload Size**: 50MB

## Production Deployment Guide (Ubuntu/Digital Ocean)

### System Preparation
```bash
# Update system limits in /etc/security/limits.conf
* soft nofile 1000000
* hard nofile 1000000

# Update sysctl settings in /etc/sysctl.conf
net.ipv4.tcp_max_syn_backlog = 65535
net.core.somaxconn = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_fin_timeout = 30
```

### Installation
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2
```

### Deployment Steps
1. Clone repository
2. Run `npm install`
3. Start server with PM2:
```bash
pm2 start socket.js --name "websocket-server" \
  --max-memory-restart 8G \
  --node-args="--max-old-space-size=8192" \
  -i max \
  --exp-backoff-restart-delay=100
```

### Error Handling & Recovery
The server implements multiple layers of error handling:

1. **Process Level**
   - Automatic worker respawn on crash
   - Memory limit monitoring
   - Uncaught exception handling

2. **Connection Level**
   - Ping/Pong health checks
   - Connection timeout handling
   - Invalid message handling

3. **Resource Level**
   - Memory usage monitoring
   - CPU usage monitoring
   - Connection limit enforcement

### Monitoring
Monitor server health using PM2:
```bash
pm2 monit
pm2 logs websocket-server
```

## Server Features

### Connection Management
- Multi-core clustering
- Load balancing across workers
- Connection validation
- IP-based rate limiting

### Security
- Connection validation
- IP tracking
- Message size limits
- Rate limiting
- Error isolation

### Performance Optimizations
- Worker-based distribution
- Memory optimization
- Event listener optimization
- Connection pooling

## Troubleshooting

### Common Issues

1. **Error: EADDRINUSE**
   - Port 9000 is already in use
   - Solution: Kill existing process or change port

2. **Memory Issues**
   - Check PM2 logs for memory usage
   - Adjust --max-old-space-size if needed

3. **Connection Timeouts**
   - Check network configuration
   - Verify client timeout settings

### Maintenance

1. **Graceful Restart**
```bash
pm2 reload websocket-server
```

2. **View Logs**
```bash
pm2 logs websocket-server
```

3. **Monitor Resources**
```bash
pm2 monit
```

## Testing

Run the test client:
```bash
node test-client.js
```

The test client simulates multiple connections to verify the server's functionality.

/**
 * NextChat WebSocket Server
 *
 * A high-performance, cluster-based WebSocket server for real-time chat applications.
 * This server utilizes Node.js clustering to distribute connections across CPU cores,
 * providing optimal performance and scalability.
 *
 * Features:
 * - Multi-core processing using Node.js clusters
 * - Connection limiting and monitoring
 * - Memory-optimized data structures
 * - Comprehensive message type handling
 * - Group chat support
 * - File and voice message handling
 *
 * @version 2.0.0
 * @license MIT
 */

const WebSocket = require('ws')
const { createServer } = require('http')
const { performance } = require('perf_hooks')
const cluster = require('cluster')
const os = require('os')
const chalk = require('chalk')
const { default: axios } = require('axios')
require('dotenv').config()

// Validate required environment variables
if (!process.env.ADMIN_ID || !process.env.API_URL) {
  console.error(
    chalk.red(
      '❌ Missing required environment variables. Please check .env file.'
    )
  )
  process.exit(1)
}

// Global error handling
process.on('uncaughtException', error => {
  console.error(chalk.red('❌ Uncaught Exception:'), error)
  // Log the error but don't exit
  // process.exit(1) // Removed to keep server running
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(
    chalk.red('❌ Unhandled Rejection at:'),
    promise,
    'reason:',
    reason
  )
  // Handle the error but don't crash
})

// Server configuration with detailed explanations
const SERVER_CONFIG = {
  port: process.env.WS_PORT || 9000,
  pingInterval: 30000, // 30 seconds between ping messages
  pongTimeout: 10000, // 10 seconds to wait for pong before considering connection dead
  maxPayloadSize: 50 * 1024 * 1024, // 50MB max message size
  backlog: 50000, // Maximum length of the queue of pending connections
  maxConnectionsPerWorker: 100000, // Maximum connections per worker process
  maxConnectionsPerIP: 20, // Rate limiting: max connections per IP
  connectionTimeout: 600000, // 10 minutes connection timeout
  workers: Math.min(os.cpus().length, 8), // Number of worker processes (max 8)
  restartDelay: 5000, // Delay before restarting a crashed worker
  maxRestartAttempts: 3, // Maximum number of restart attempts per worker
  shutdownTimeout: 10000 // Time to wait for graceful shutdown
}

// Performance monitoring metrics
const metrics = {
  startTime: Date.now(),
  totalConnections: 0,
  activeConnections: 0,
  messagesSent: 0,
  messagesReceived: 0,
  errors: 0,
  lastError: null
}

// Calculate total possible connections
const TOTAL_MAX_CONNECTIONS =
  SERVER_CONFIG.maxConnectionsPerWorker * SERVER_CONFIG.workers

// ASCII Art and Console Styling
const serverBanner = `
${chalk.cyan(`
new chat                                  
`)}
${chalk.yellow(
  '======================================================================='
)}
${chalk.green('🚀 Next-Generation WebSocket Server')} ${chalk.gray('v2.0.0')}
${chalk.yellow(
  '======================================================================='
)}
`

// Server status template
const getServerStatus = (workers, maxConnections) => `
${chalk.cyan('🔧 Server Configuration:')}
${chalk.yellow('├─')} 📡 Workers: ${chalk.green(workers)}
${chalk.yellow('├─')} 🔌 Max Connections: ${chalk.green(
  maxConnections.toLocaleString()
)}
${chalk.yellow('├─')} 💾 Memory Limit: ${chalk.green('8GB')}
${chalk.yellow('└─')} 🚦 Status: ${chalk.green('ONLINE')}
`

if (cluster.isPrimary) {
  console.clear() // Clear console first
  console.log(serverBanner)

  console.log(chalk.cyan('🎮 Initializing Server Components...'))
  console.log(chalk.yellow('├─ 📡 Starting WebSocket Server'))
  console.log(chalk.yellow('├─ 🔄 Initializing Cluster'))
  console.log(chalk.yellow('└─ ⚡ Preparing Workers\n'))

  console.log(
    getServerStatus(
      SERVER_CONFIG.workers,
      SERVER_CONFIG.workers * SERVER_CONFIG.maxConnectionsPerWorker
    )
  )

  // Fork workers
  for (let i = 0; i < SERVER_CONFIG.workers; i++) {
    const worker = cluster.fork()
    // console.log(
    //   chalk.green(`🔧 Worker ${i + 1} spawned`) +
    //     chalk.gray(` [PID: ${worker.process.pid}]`)
    // )
  }

  cluster.on('online', worker => {
    // console.log(
    //   chalk.green(`✨ Worker ${worker.id} is ready to handle connections`)
    // )
  })

  cluster.on('exit', (worker, code, signal) => {
    console.log(
      chalk.red(`⚠️  Worker ${worker.id} died. Signal: ${signal || code}`)
    )
    // ... rest of exit handler
  })

  function handleWorkerMessage (message) {
    if (message.type === 'connection_count') {
      metrics.activeConnections = message.count
      metrics.totalConnections++
    } else if (message.type === 'error') {
      metrics.errors++
      metrics.lastError = message.error
    }
  }

  // Handle worker messages
  cluster.on('message', handleWorkerMessage)

  // Graceful shutdown handler
  process.on('SIGTERM', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)

  function gracefulShutdown () {
    console.log('Initiating graceful shutdown...')

    // Stop accepting new connections
    for (const id in cluster.workers) {
      cluster.workers[id].send({ type: 'shutdown' })
    }

    // Wait for workers to finish
    setTimeout(() => {
      console.log('Forcing shutdown...')
      process.exit(1)
    }, SERVER_CONFIG.shutdownTimeout)
  }
} else {
  // Worker process
  const wss = new WebSocket.Server({
    port: SERVER_CONFIG.port,
    backlog: SERVER_CONFIG.backlog,
    maxPayload: SERVER_CONFIG.maxPayloadSize,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024
    }
  })

  // Track connections per IP
  const connectionsPerIP = new Map()

  wss.on('listening', () => {
    console.log(
      chalk.blue(
        `🔌 Worker ${cluster.worker.id} listening on port ${chalk.yellow(
          SERVER_CONFIG.port
        )}`
      )
    )
  })

  wss.on('error', error => {
    if (error.code === 'EADDRINUSE') {
      console.log(chalk.red(`🚨 Port ${SERVER_CONFIG.port} is already in use`))
    } else {
      console.error(chalk.red('❌ Server error:'), error)
      process.send({ type: 'error', error })
    }
  })

  // Track connections and groups
  const clients = new Map()
  const groups = new Map()
  let totalConnections = 0

  wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress

    // Initialize or increment connection count for this IP
    const currentConnections = connectionsPerIP.get(clientIP) || 0

    if (currentConnections >= SERVER_CONFIG.maxConnectionsPerIP) {
      console.log(chalk.red(`🚫 Connection limit exceeded for IP ${clientIP}`))
      ws.send(
        JSON.stringify({
          type: 'error',
          error: 'connection_limit_exceeded',
          message:
            'Maximum connection limit reached. Please close other connections before opening a new one.'
        })
      )
      ws.close()
      return
    }

    connectionsPerIP.set(clientIP, currentConnections + 1)

    // Clean up when connection closes
    ws.on('close', () => {
      clearInterval(pingInterval)
      clearInterval(pongCheck)

      // Clean up client
      const client = clients.get(ws)
      if (client) {
        // Remove from groups
        client.groups?.forEach(groupId => {
          const group = groups.get(groupId)
          if (group && group instanceof Set) {
            group.delete(ws)
            // Clean up empty groups
            if (group.size === 0) {
              groups.delete(groupId)
            }
          }
        })

        // Remove client
        clients.delete(ws)
      }

      // Update counts
      totalConnections--
      const currentConnections = connectionsPerIP.get(clientIP)
      if (currentConnections > 0) {
        connectionsPerIP.set(clientIP, currentConnections - 1)
      }
      if (connectionsPerIP.get(clientIP) <= 0) {
        connectionsPerIP.delete(clientIP)
      }

      console.log(
        chalk.yellow(
          `📴 Client disconnected. Active connections for IP ${clientIP}: ${
            connectionsPerIP.get(clientIP) || 0
          }`
        )
      )

      process.send({ type: 'connection_count', count: totalConnections })
      broadcastOnlineStatus()
    })

    console.log(chalk.green(`📱 New connection from ${chalk.yellow(clientIP)}`))

    // Update connection counts
    totalConnections++
    // connectionsPerIP.set(clientIP, (connectionsPerIP.get(clientIP) || 0) + 1);

    // Initialize client info
    const clientInfo = {
      ws,
      _id: null,
      username: '',
      avatar: '',
      isOnline: true,
      groups: [],
      ip: clientIP,
      connectionTime: new Date().toISOString()
    }

    // Store client
    clients.set(ws, clientInfo)

    // Notify master about connection count
    process.send({ type: 'connection_count', count: totalConnections })

    // Set up ping interval
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping()
      }
    }, SERVER_CONFIG.pingInterval)

    // Handle pong timeout
    let pongReceived = true
    ws.on('pong', () => {
      pongReceived = true
    })

    // Check for pong responses
    const pongCheck = setInterval(() => {
      if (!pongReceived) {
        console.log(
          chalk.red(`⚠️ Client not responding to ping, closing connection`)
        )
        ws.terminate()
        clearInterval(pongCheck)
        return
      }
      pongReceived = false
    }, SERVER_CONFIG.pongTimeout)

    // Handle incoming messages
    ws.on('message', message => {
      try {
        const parsedMessage = JSON.parse(message)
        // console.log(
        //   chalk.green(`📨 Worker ${cluster.worker.id} received message:`),
        //   parsedMessage
        // )

        switch (parsedMessage.type) {
          case 'login':
            handleLogin(ws, parsedMessage.data)
            break

          case 'message':
            handleMessage(ws, parsedMessage)
            break

          case 'online_status':
            handleVisibilityChange(ws, parsedMessage)
            break

          case 'typing':
            handleTyping(ws, parsedMessage)
            break

          case 'messageSeen':
            handleMessageSeen(ws, parsedMessage)
            break

          case 'messageDelivered':
            handleMessageDelivered(ws, parsedMessage)
            break

          case 'presenceUpdate':
            handlePresenceUpdate(ws, parsedMessage)
            break

          case 'joinGroup':
            handleJoinGroup(ws, parsedMessage)
            break

          case 'reaction':
            handleReaction(ws, parsedMessage)
            break

          case 'file':
            handleFileMessage(ws, parsedMessage)
            break

          case 'voiceMessage':
            handleVoiceMessage(ws, parsedMessage)
            break

          case 'deleteMessage':
            handleDeleteMessage(ws, parsedMessage)
            break

          case 'editMessage':
            handleEditMessage(ws, parsedMessage)
            break

          case 'group_message':
            handleGroupMessage(ws, parsedMessage)
            break

          case 'adminMessage':
            handleAdminMessage(ws, parsedMessage)
            break

          case 'userMessage':
            handleUserMessage(ws, parsedMessage)
            break

          default:
            console.log(
              chalk.red(`🚫 Unknown message type: ${parsedMessage.type}`),
              parsedMessage
            )
            ws.send(
              JSON.stringify({
                type: 'error',
                error: `Unsupported message type: ${parsedMessage.type}`,
                originalMessage: parsedMessage
              })
            )
        }
      } catch (error) {
        console.error(chalk.red('❌ Error processing message:'), error)
        ws.send(
          JSON.stringify({
            type: 'error',
            error: 'Invalid message format',
            details: error.message
          })
        )
      }
    })

    // Initial broadcast of online status
    broadcastOnlineStatus()
  })

  // Handle server errors
  wss.on('error', error => {
    if (error.code === 'EADDRINUSE') {
      console.log(chalk.red(`🚨 Port ${SERVER_CONFIG.port} is already in use`))
    } else {
      console.error(chalk.red('❌ Server error:'), error)
      process.send({ type: 'error', error })
    }
  })

  // Handle process errors
  process.on('uncaughtException', error => {
    console.error(chalk.red('❌ Uncaught Exception:'), error)
    process.send({ type: 'error', error })
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error(
      chalk.red('❌ Unhandled Rejection at:'),
      promise,
      'reason:',
      reason
    )
    process.send({ type: 'error', error: reason })
  })

  // Message Handlers
  function handleLogin (ws, userData) {
    const { _id: userId, username, avatar, groups: userGroups } = userData
    // console.log('👋 User logging in:', userId, userData)

    // Store user data in WebSocket object
    ws.userData = {
      _id: userId,
      username,
      avatar: avatar || '',
      groups: userGroups || []
    }

    // Add user to their groups
    if (userGroups && Array.isArray(userGroups)) {
      userGroups.forEach(groupId => {
        if (!groups.has(groupId)) {
          groups.set(groupId, new Set())
        }
        groups.get(groupId).add(ws)
      })
    }

    // Store client info
    clients.set(ws, {
      _id: userId,
      username,
      avatar: avatar || '',
      isOnline: true,
      groups: userGroups || [],
      lastSeen: new Date().toISOString()
    })

    // Send online status to all connected clients
    broadcastOnlineStatus()

    // Send confirmation to the logged-in user
    ws.send(
      JSON.stringify({
        type: 'loginSuccess',
        userId: userId,
        timestamp: new Date().toISOString()
      })
    )
  }

  function handleVisibilityChange (ws, data) {
    const { isOnline } = data
    const clientInfo = clients.get(ws)
    clientInfo.isOnline = isOnline
    broadcastOnlineStatus()
  }

  async function handleUserMessage (ws, data) {
    try {
      if (!ws.userData) {
        return ws.send(
          JSON.stringify({
            type: 'error',
            error: 'User not authenticated'
          })
        )
      }

      const { messageId, content, messageType, mediaUrl } = data?.data || {}
      
      // Prepare message data for socket delivery
      const messageData = {
        type: 'user_message',
        data: {
          _id: messageId,
          content: content || '',
          messageType,
          mediaUrl,
          sender: {
            _id: ws.userData._id,
            username: ws.userData.username,
            avatar: ws.userData.avatar || ''
          },
          receiver: process.env.ADMIN_ID,
          timestamp: new Date().toISOString(),
          status: [
            {
              userId: process.env.ADMIN_ID,
              status: 'sent',
              timestamp: Date.now()
            }
          ]
        }
      }

      // Send to admin if online
      let adminNotified = false
      wss.clients.forEach(client => {
        if (
          client.readyState === WebSocket.OPEN &&
          client.userData &&
          client.userData._id === process.env.ADMIN_ID
        ) {
          client.send(JSON.stringify(messageData))
          adminNotified = true
        }
      })

      // Send delivery confirmation to user
      ws.send(
        JSON.stringify({
          type: 'message_delivered',
          data: {
            messageId,
            delivered: adminNotified
          }
        })
      )

      if (!adminNotified) {
        console.log(
          chalk.yellow('⚠️ Admin is offline, message will be delivered when online')
        )
      }
    } catch (error) {
      console.error(chalk.red('❌ Error in handleUserMessage:'), error)
      ws.send(
        JSON.stringify({
          type: 'error',
          error: 'Failed to process message'
        })
      )
    }
  }

  async function handleAdminMessage (ws, data) {
    try {
      if (!ws.userData || ws.userData._id !== process.env.ADMIN_ID) {
        return ws.send(
          JSON.stringify({
            type: 'error',
            error: 'Unauthorized: Admin access required'
          })
        )
      }

      const { messageId, content, messageType, mediaUrl, receiver } = data?.data || {}
      
      if (!receiver) {
        return ws.send(
          JSON.stringify({
            type: 'error',
            error: 'Receiver is required'
          })
        )
      }

      // Prepare message data for socket delivery
      const messageData = {
        type: 'admin_message',
        data: {
          _id: messageId,
          content: content || '',
          messageType,
          mediaUrl,
          sender: {
            _id: ws.userData._id,
            username: ws.userData.username,
            avatar: ws.userData.avatar || ''
          },
          receiver,
          timestamp: new Date().toISOString(),
          status: [
            {
              userId: receiver,
              status: 'sent',
              timestamp: Date.now()
            }
          ]
        }
      }

      // Send to user if online
      let userNotified = false
      wss.clients.forEach(client => {
        if (
          client.readyState === WebSocket.OPEN &&
          client.userData &&
          client.userData._id === receiver
        ) {
          client.send(JSON.stringify(messageData))
          userNotified = true
        }
      })

      // Send delivery confirmation to admin
      ws.send(
        JSON.stringify({
          type: 'message_delivered',
          data: {
            messageId,
            receiver,
            delivered: userNotified
          }
        })
      )

      if (!userNotified) {
        console.log(
          chalk.yellow(
            `⚠️ User ${receiver} is offline, message will be delivered when online`
          )
        )
      }
    } catch (error) {
      console.error(chalk.red('❌ Error in handleAdminMessage:'), error)
      ws.send(
        JSON.stringify({
          type: 'error',
          error: 'Failed to deliver message'
        })
      )
    }
  }

  function handleVisibilityChange (ws, data) {
    const { isOnline } = data
    const clientInfo = clients.get(ws)
    clientInfo.isOnline = isOnline
    broadcastOnlineStatus()
  }

  function handleMessageSeen (ws, data) {
    const { messageId, sender } = data
    const senderConnection = Array.from(clients.values()).find(
      conn => conn._id === sender
    )

    if (senderConnection) {
      senderConnection.ws.send(
        JSON.stringify({
          type: 'messageSeen',
          messageId,
          seenBy: ws.userData._id,
          timestamp: new Date().toISOString()
        })
      )
    }
  }

  function handleMessageDelivered (ws, data) {
    const { messageId, sender } = data
    const senderConnection = Array.from(clients.values()).find(
      conn => conn._id === sender
    )

    if (senderConnection) {
      senderConnection.ws.send(
        JSON.stringify({
          type: 'messageDelivered',
          messageId,
          deliveredTo: ws.userData._id,
          timestamp: new Date().toISOString()
        })
      )
    }
  }

  function handleMessage (ws, message) {
    console.log(chalk.green(`📨 Handling message:`), message)

    // Handle both direct message format and wrapped message format
    const messageData = message.data || message
    // const messageType = message?.type || "message";
    const messageType = 'message'

    const receiverId = messageData.receiver
    const senderId = messageData.sender?._id || ws.userData._id
    const isGroup =
      messageData.isGroup === 'true' || messageData.isGroup === true

    console.log(chalk.green(`📝 Message routing info:`), {
      receiverId,
      senderId,
      isGroup,
      messageType: messageData.messageType,
      type: messageType,
      timestamp: messageData.timestamp
    })

    if (isGroup) {
      handleGroupMessage(ws, messageData)
    } else {
      // Find the receiver's connection
      const receiverConnection = Array.from(clients.values()).find(
        conn => conn._id === receiverId
      )

      console.log(
        chalk.green(`👀 Receiver connection found:`),
        !!receiverConnection,
        'Receiver ID:',
        receiverId
      )

      if (receiverConnection) {
        try {
          // Format message for receiver with type in data
          const formattedMessage = {
            type: messageType,
            data: {
              ...messageData,
              type: messageType,
              status: [
                {
                  userId: receiverId,
                  status: 'delivered',
                  timestamp: Date.now()
                }
              ]
            }
          }

          console.log(
            chalk.green(`📨 Sending formatted message:`),
            formattedMessage
          )
          receiverConnection.ws.send(JSON.stringify(formattedMessage))

          // Update sender's message status
          ws.send(
            JSON.stringify({
              type: 'messageStatus',
              data: {
                messageId: messageData._id,
                type: 'messageStatus',
                status: {
                  userId: receiverId,
                  status: 'delivered',
                  timestamp: Date.now()
                }
              }
            })
          )
        } catch (error) {
          console.error(chalk.red(`❌ Error sending message:`), error)
          ws.send(
            JSON.stringify({
              type: 'error',
              data: {
                type: 'error',
                messageId: messageData._id,
                error: 'Failed to send message',
                details: error.message
              }
            })
          )
        }
      } else {
        console.log(chalk.red(`🚫 Receiver offline or not found:`), receiverId)
        // Update message status as pending
        ws.send(
          JSON.stringify({
            type: 'messageStatus',
            data: {
              type: 'messageStatus',
              messageId: messageData._id,
              status: {
                userId: receiverId,
                status: 'pending',
                timestamp: Date.now()
              }
            }
          })
        )
      }
    }
  }

  function handleGroupMessage (ws, data) {
    try {
      if (!data?.data?.groupId) {
        console.warn(chalk.yellow('⚠️ Invalid group message format'))
        return ws.send(
          JSON.stringify({
            type: 'error',
            error: 'Invalid message format'
          })
        )
      }

      const { groupId } = data.data

      if (!ws.userData || !ws.userData?.groups) {
        console.warn(
          chalk.yellow(
            `⚠️ Unauthenticated group message attempt from ${
              ws.userData?._id || 'unknown'
            }`
          )
        )
        return ws.send(
          JSON.stringify({
            type: 'error',
            error: 'User not authenticated or not in any groups'
          })
        )
      }

      if (!ws.userData.groups.includes(groupId)) {
        console.warn(
          chalk.yellow(
            `⚠️ Unauthorized group message attempt to ${groupId} from ${ws.userData._id}`
          )
        )
        return ws.send(
          JSON.stringify({
            type: 'error',
            error: 'User is not a member of this group'
          })
        )
      }

      const messageData = {
        type: 'group_message',
        data: {
          ...data.data,
          sender: {
            _id: ws.userData._id,
            username: ws.userData.username,
            avatar: ws.userData.avatar || ''
          }
        }
      }

      // Broadcast to all members of the group
      const result = broadcastToGroup(groupId, messageData)

      // If broadcast failed, notify sender
      if (!result) {
        ws.send(
          JSON.stringify({
            type: 'error',
            error: 'Message delivery failed'
          })
        )
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error in handleGroupMessage:`), error)
      // Try to send error message to client if possible
      try {
        ws.send(
          JSON.stringify({
            type: 'error',
            error: 'Failed to send group message'
          })
        )
      } catch (sendError) {
        console.error(
          chalk.red(`❌ Could not send error to client:`),
          sendError
        )
      }
    }
  }

  function broadcastToGroup (groupId, message) {
    try {
      const groupMembers = groups.get(groupId)
      if (!groupMembers || !(groupMembers instanceof Set)) {
        console.warn(
          chalk.yellow(`⚠️ No valid members found for group ${groupId}`)
        )
        return false
      }

      let successCount = 0
      let failCount = 0

      groupMembers.forEach(memberWs => {
        if (memberWs && memberWs.readyState === WebSocket.OPEN) {
          try {
            memberWs.send(JSON.stringify(message))
            successCount++
          } catch (err) {
            console.error(
              chalk.red(`❌ Error sending to member in group ${groupId}:`),
              err
            )
            failCount++
          }
        }
      })

      console.log(
        chalk.green(`📨 Group message broadcast stats for ${groupId}:`),
        `Success: ${successCount}, Failed: ${failCount}`
      )

      return successCount > 0
    } catch (error) {
      console.error(chalk.red(`❌ Error in broadcastToGroup:`), error)
      return false
    }
  }

  function handlePersonalMessage (ws, data) {
    const { receiver } = data
    const sender = clients.get(ws)

    // Find recipient
    for (const [recipientWs, recipientInfo] of clients.entries()) {
      if (
        recipientInfo._id === receiver &&
        recipientWs.readyState === WebSocket.OPEN
      ) {
        recipientWs.send(
          JSON.stringify({
            type: 'message',
            data: {
              ...data,
              senderId: sender._id,
              senderUsername: sender.username,
              senderAvatar: sender.avatar
            }
          })
        )
        break
      }
    }
  }

  function handleJoinGroup (ws, data) {
    const { groupId } = data
    const clientInfo = clients.get(ws)
    if (!clientInfo) return

    if (!groups.has(groupId)) {
      groups.set(groupId, [])
    }

    const group = groups.get(groupId)
    if (!group.some(member => member.ws === ws)) {
      group.push(clientInfo)
      clientInfo.groups.push(groupId)

      // Notify group members
      broadcastToGroup(groupId, {
        type: 'userJoin',
        data: {
          groupId,
          user: {
            _id: clientInfo._id,
            username: clientInfo.username,
            avatar: clientInfo.avatar
          }
        }
      })
    }
  }

  function generateMessageId () {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  function handleGetGroupOnlineUsers (ws, data) {
    const { groupId } = data
    const group = groups.get(groupId)

    if (group) {
      const onlineUsers = group
        .filter(member => member.ws.readyState === WebSocket.OPEN)
        .map(member => ({
          _id: member._id,
          username: member.username,
          avatar: member.avatar,
          isOnline: true
        }))

      ws.send(
        JSON.stringify({
          type: 'groupOnlineUsers',
          data: { groupId, onlineUsers }
        })
      )
    }
  }

  function handlePresenceUpdate (ws, data) {
    const { isOnline } = data
    const clientInfo = clients.get(ws)
    clientInfo.isOnline = isOnline
    broadcastOnlineStatus()
  }

  function handleReaction (ws, data) {
    const { messageId, reaction, groupId } = data
    const clientInfo = clients.get(ws)

    const message = {
      type: 'reaction',
      data: {
        messageId,
        reaction,
        userId: clientInfo._id,
        username: clientInfo.username
      }
    }

    if (groupId) {
      broadcastToGroup(groupId, message)
    } else {
      broadcastToAllClients(message)
    }
  }

  function handleFileMessage (ws, data) {
    const clientInfo = clients.get(ws)
    const message = {
      type: 'file',
      data: {
        ...data,
        senderId: clientInfo._id,
        senderUsername: clientInfo.username,
        timestamp: new Date().toISOString()
      }
    }

    if (data.groupId) {
      broadcastToGroup(data.groupId, message)
    } else if (data.receiverId) {
      for (const [recipientWs, recipientInfo] of clients.entries()) {
        if (recipientInfo._id === data.receiverId) {
          recipientWs.send(JSON.stringify(message))
          break
        }
      }
    }
  }

  function handleVoiceMessage (ws, data) {
    const clientInfo = clients.get(ws)
    const message = {
      type: 'voiceMessage',
      data: {
        ...data,
        senderId: clientInfo._id,
        senderUsername: clientInfo.username,
        timestamp: new Date().toISOString()
      }
    }

    if (data.groupId) {
      broadcastToGroup(data.groupId, message)
    } else if (data.receiverId) {
      for (const [recipientWs, recipientInfo] of clients.entries()) {
        if (recipientInfo._id === data.receiverId) {
          recipientWs.send(JSON.stringify(message))
          break
        }
      }
    }
  }

  function handleDeleteMessage (ws, data) {
    const { messageId, groupId } = data
    const message = {
      type: 'deleteMessage',
      data: { messageId }
    }

    if (groupId) {
      broadcastToGroup(groupId, message)
    } else {
      broadcastToAllClients(message)
    }
  }

  function handleEditMessage (ws, data) {
    const { messageId, newContent, groupId } = data
    const message = {
      type: 'editMessage',
      data: { messageId, newContent }
    }

    if (groupId) {
      broadcastToGroup(groupId, message)
    } else {
      broadcastToAllClients(message)
    }
  }

  function handleNewChat (ws, data) {
    const { receiverId } = data
    for (const [recipientWs, recipientInfo] of clients.entries()) {
      if (recipientInfo._id === receiverId) {
        recipientWs.send(JSON.stringify({ type: 'newChat', data }))
        break
      }
    }
  }

  // Helper function to broadcast to all clients
  function broadcastToAllClients (message) {
    for (const [ws, _] of clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message))
      }
    }
  }

  // Helper function to broadcast to a specific group
  function broadcastToGroup (groupId, message) {
    const groupMembers = groups.get(groupId) || []
    groupMembers?.forEach(memberWs => {
      if (memberWs?.readyState === WebSocket.OPEN) {
        memberWs.send(JSON.stringify(message))
      }
    })
  }

  function handleTyping (ws, data) {
    try {
      const { isTyping, receiverId } = data

      // Only handle typing for direct messages, not groups
      if (!receiverId) return

      const receiverConnection = Array.from(clients.values()).find(
        conn => conn._id === receiverId
      )

      if (receiverConnection) {
        receiverConnection.ws.send(
          JSON.stringify({
            type: 'typing',
            userId: ws.userData._id,
            isTyping
          })
        )
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error in handleTyping:`), error)
    }
  }

  function broadcastOnlineStatus () {
    const onlineUsers = Array.from(clients.values())
      .filter(client => client._id)
      .map(client => ({
        _id: client._id,
        username: client.username,
        avatar: client.avatar,
        isOnline: true
      }))

    for (const [ws, client] of clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'onlineStatus',
            data: onlineUsers
          })
        )
      }
    }
  }
}

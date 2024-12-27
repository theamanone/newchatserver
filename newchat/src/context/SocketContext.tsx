'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode
} from 'react'
import { useAppContext } from '@/context/useContext'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  activeUsers: ActiveUser[]
  newMessage: any
  setNewMessage: any
  subscribeToGroup: (groupId: string) => void
  unsubscribeFromGroup: (groupId: string) => void
  sendMessage: (message: MessagePayload) => void
  sendSeenStatus: (message: any) => void
  cleanupSocketConnection: () => void
  sendUserMessage: (message: any) => void
  sendAdminMessage: (message: any) => void
  sendMessageReply: (messageId: string, content: string, role: string) => void
  deleteMessage: (messageId: string, applicationId: string) => void
  onMessageReplied?: (messageId: string, reply: any) => void
  onMessageDeleted?: (messageId: string) => void
}

interface MessagePayload {
  _id?: string
  content: string
  messageType: string
  mediaUrl?: string
  file?: File
  sender?: {
    _id: string
    username: string
    avatar: string
  }
  receiver?: string
  groupId?: string
  isGroup?: boolean
  timestamp?: string
  status?: any[]
}

interface ActiveUser {
  _id: string
  username: string
  avatar: string
  isOnline: boolean
}

const SocketContext = createContext<SocketContextType | null>(null)

export const SocketProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const { account } = useAppContext()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [newMessage, setNewMessage] = useState<any>(null)
  const [subscribedGroups, setSubscribedGroups] = useState<Set<string>>(new Set())
  const [connectionLimitExceeded, setConnectionLimitExceeded] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasConnectionLimitError = useRef(false)

  const showConnectionLimitAlert = () => {
    // alert('Connection limit exceeded. Please close other browser tabs or sessions and refresh the page to reconnect.');
  }

  const cleanupSocket = useCallback(() => {
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current)
      loginTimeoutRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (socket) {
      socket.close()
      setSocket(null)
    }
    setIsLoggingIn(false)
  }, [socket])

  const handleConnectionLimitError = useCallback(() => {
    console.log('Connection limit exceeded, stopping all connection attempts')
    hasConnectionLimitError.current = true
    setConnectionLimitExceeded(true)
    cleanupSocket()
    showConnectionLimitAlert()
  }, [cleanupSocket])

  const initializeSocket = useCallback(() => {
    if (
      !account?._id ||
      hasConnectionLimitError.current ||
      connectionLimitExceeded ||
      socket
    ) {
      console.log(
        'Not initializing socket:',
        !account?._id
          ? 'No account'
          : socket
          ? 'Socket already exists'
          : 'Connection limit exceeded'
      )
      return
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
    })

    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    // Message events
    socketInstance.on('newMessage', (message) => {
      console.log('New message received:', message)
      setNewMessage(message)
    })

    socketInstance.on('messageDeleted', (messageId) => {
      console.log('Message deleted:', messageId)
      setNewMessage((prev: any) => prev.filter((msg: any) => msg._id !== messageId))
    })

    socketInstance.on('messageUpdated', (message) => {
      console.log('Message updated:', message)
      setNewMessage((prev: any) => {
        if (prev?._id === message._id) {
          return message
        }
        return prev
      })
    })

    // User events
    socketInstance.on('userBlocked', (userId) => {
      console.log('User blocked:', userId)
    })

    socketInstance.on('userUnblocked', (userId) => {
      console.log('User unblocked:', userId)
    })

    // Typing events
    socketInstance.on('userTyping', (data) => {
      console.log('User typing:', data)
    })

    socketInstance.on('userStoppedTyping', (data) => {
      console.log('User stopped typing:', data)
    })

    // Application events
    socketInstance.on('applicationUpdated', (data) => {
      console.log('Application updated:', data)
    })

    // Online status
    socketInstance.on('onlineStatus', (data) => {
      setActiveUsers(data)
    })

    // Message seen
    socketInstance.on('messageSeen', (data) => {
      setNewMessage((prev: any) => {
        if (prev?._id === data.messageId) {
          return {
            ...prev,
            status: [
              ...(prev.status || []),
              {
                userId: data.receiver,
                status: 'seen',
                timestamp: new Date()
              }
            ]
          }
        }
        return prev
      })
    })

    // Message delivered
    socketInstance.on('messageDelivered', (data) => {
      setNewMessage((prev: any) => {
        if (prev?._id === data.messageId) {
          return {
            ...prev,
            status: [
              ...(prev.status || []),
              {
                userId: data.receiver,
                status: 'delivered',
                timestamp: new Date()
              }
            ]
          }
        }
        return prev
      })
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [account?._id])

  const cleanupConnection = useCallback(() => {
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current)
      loginTimeoutRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (socket) {
      socket.close()
      setSocket(null)
    }
    setIsLoggingIn(false)
  }, [socket])

  useEffect(() => {
    let mounted = true

    if (
      mounted &&
      account?._id &&
      !hasConnectionLimitError.current &&
      !connectionLimitExceeded &&
      !socket
    ) {
      initializeSocket()
    }

    return () => {
      mounted = false
      cleanupSocket()
      hasConnectionLimitError.current = false
      setConnectionLimitExceeded(false)
    }
  }, [account?._id])

  useEffect(() => {
    return () => {
      hasConnectionLimitError.current = false
      setConnectionLimitExceeded(false)
    }
  }, [account?._id])

  useEffect(() => {
    if (connectionLimitExceeded) {
      showConnectionLimitAlert()
    }
  }, [connectionLimitExceeded])

  const sendMessage = useCallback(
    async (message: MessagePayload) => {
      if (
        !socket ||
        hasConnectionLimitError.current ||
        connectionLimitExceeded
      ) {
        console.log(
          'Cannot send message: Socket not connected or connection limit exceeded'
        )
        return
      }

      if (socket?.connected) {
        try {
          socket.emit('message', message)
        } catch (error) {
          console.error('Error sending message:', error)
          throw error
        }
      }
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  )

  const sendUserMessage = useCallback(
    (message: any) => {
      if (
        !socket ||
        hasConnectionLimitError.current ||
        connectionLimitExceeded
      ) {
        console.log(
          'Cannot send message: Socket not connected or connection limit exceeded'
        )
        return
      }

      if (socket?.connected) {
        socket.emit('userMessage', message)
      }
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  )

  const sendAdminMessage = useCallback(
    (message: any) => {
      if (
        !socket ||
        hasConnectionLimitError.current ||
        connectionLimitExceeded
      ) {
        console.log(
          'Cannot send message: Socket not connected or connection limit exceeded'
        )
        return
      }

      if (socket?.connected) {
        socket.emit('adminMessage', message)
      }
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  )

  const sendSeenStatus = useCallback(
    (message: any) => {
      if (
        !socket ||
        hasConnectionLimitError.current ||
        connectionLimitExceeded
      ) {
        console.log(
          'Cannot send seen status: Socket not connected or connection limit exceeded'
        )
        return
      }

      if (socket?.connected && !message.isGroup) {
        socket.emit('messageSeen', {
          messageId: message._id,
          sender: message.sender._id,
          receiver: account?._id
        })
      }
    },
    [account?._id, socket, hasConnectionLimitError, connectionLimitExceeded]
  )

  const subscribeToGroup = useCallback(
    (groupId: string) => {
      if (!socket || hasConnectionLimitError.current || connectionLimitExceeded) return;

      if (!subscribedGroups.has(groupId)) {
        socket?.emit('subscribe', { groupId })
        setSubscribedGroups(prev => new Set([...Array.from(prev), groupId]))
      }
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  );

  const unsubscribeFromGroup = useCallback(
    (groupId: string) => {
      if (!socket || hasConnectionLimitError.current || connectionLimitExceeded) return;

      if (subscribedGroups.has(groupId)) {
        socket?.emit('unsubscribe', { groupId })
        setSubscribedGroups(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(groupId);
          return newSet;
        });
      }
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  );

  const sendMessageReply = useCallback(
    (messageId: string, content: string, role: string) => {
      if (!socket || hasConnectionLimitError || connectionLimitExceeded) return;

      socket?.emit('messageReply', {
        messageId,
        content,
        role
      });
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  );

  const deleteMessage = useCallback(
    (messageId: string, applicationId: string) => {
      if (!socket || hasConnectionLimitError || connectionLimitExceeded) return;

      socket?.emit('deleteMessage', {
        messageId,
        applicationId
      });
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  );

  const cleanupSocketConnection = () => {
    if (socket) {
      socket.close()
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeUsers,
        newMessage,
        setNewMessage,
        subscribeToGroup,
        unsubscribeFromGroup,
        sendMessage,
        sendSeenStatus,
        cleanupSocketConnection,
        sendUserMessage,
        sendAdminMessage,
        sendMessageReply,
        deleteMessage
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

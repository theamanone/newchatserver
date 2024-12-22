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

interface SocketContextType {
  socket: WebSocket | null
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
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [newMessage, setNewMessage] = useState<any>(null)
  const [subscribedGroups, setSubscribedGroups] = useState<string[] | any>([])
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

    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:9000'
    // console.log('Initializing socket connection...');

    const ws = new WebSocket(SOCKET_URL)
    setSocket(ws)

    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 5

    ws.onopen = () => {
      // console.log('WebSocket connection established');

      if (hasConnectionLimitError.current || connectionLimitExceeded) {
        // console.log('Connection limit was exceeded, closing connection');
        ws.close()
        return
      }

      if (isLoggingIn) return

      setIsLoggingIn(true)
      loginTimeoutRef.current = setTimeout(() => {
        if (
          ws.readyState === WebSocket.OPEN &&
          !hasConnectionLimitError.current
        ) {
          ws.send(
            JSON.stringify({
              type: 'login',
              data: {
                _id: account._id,
                username: account.username,
                avatar: account.avatar,
                groups: account.groups || []
              }
            })
          )
        }
        setIsLoggingIn(false)
      }, 1000)
    }

    ws.onmessage = event => {
      if (hasConnectionLimitError.current || connectionLimitExceeded) {
        // console.log('Connection limit exceeded, ignoring message');
        return
      }

      try {
        const data = JSON.parse(event.data)
        // console.log('WebSocket message received:', data);

        if (
          data.type === 'error' &&
          data.error === 'connection_limit_exceeded'
        ) {
          handleConnectionLimitError()
          return
        }

        switch (data.type) {
          case 'message':
          case 'group_message':
            // console.log("received message : ", data.data)
            setNewMessage(data.data)
            break
          case 'onlineStatus':
            setActiveUsers(data.data)
            break
          case 'messageSeen':
            handleMessageSeen(data.data)
            break
          case 'messageDelivered':
            handleMessageDelivered(data.data)
            break
          case 'error':
            console.error('WebSocket error:', data.error)
            break
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }

    ws.onclose = event => {
      // console.log('WebSocket connection closed:', event);
      setSocket(null)
      setIsLoggingIn(false)

      if (
        !hasConnectionLimitError.current &&
        !connectionLimitExceeded &&
        reconnectAttempts < MAX_RECONNECT_ATTEMPTS
      ) {
        // console.log(`Planning reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!hasConnectionLimitError.current && !connectionLimitExceeded) {
            // console.log('Attempting to reconnect...');
            reconnectAttempts++
            initializeSocket()
          }
        }, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)) // Exponential backoff with max 30s
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        // console.log('Max reconnection attempts reached. Please refresh the page to reconnect.');
        hasConnectionLimitError.current = true
        setConnectionLimitExceeded(true)
      }
    }

    ws.onerror = error => {
      console.error('WebSocket error:', error)
    }

    return () => cleanupSocket()
  }, [
    account,
    connectionLimitExceeded,
    isLoggingIn,
    handleConnectionLimitError,
    cleanupSocket
  ])

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
      // console.log('Initializing socket on mount or account change');
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
      // console.log('Sending message:', message);
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

      if (socket?.readyState === WebSocket.OPEN) {
        try {
          // console.log("socket message payload : ", {
          //   type: message.groupId ? 'group_message' : 'message',
          //   data: {
          //     _id: message._id,
          //     content: message.content,
          //     messageType: message.messageType,
          //     mediaUrl: message.mediaUrl,
          //     sender: message.sender,
          //     receiver: message.receiver,
          //     groupId: message.groupId,
          //     timestamp: message.timestamp,
          //     status: message.status || [],
          //     isGroup: message.isGroup
          //   }
          // });
          socket.send(
            JSON.stringify({
              type: message.groupId ? 'group_message' : 'message',
              data: {
                _id: message._id,
                content: message.content,
                messageType: message.messageType,
                mediaUrl: message.mediaUrl,
                sender: message.sender,
                receiver: message.receiver,
                groupId: message.groupId,
                timestamp: message.timestamp,
                status: message.status || [],
                isGroup: message.isGroup
              }
            })
          )
        } catch (error) {
          console.error('Error sending message:', error)
          throw error
        }
      }
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  )

  // support user
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

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'userMessage',
            data: message
          })
        )
      }
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  )

  // support admin
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

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'adminMessage',
            data: message
          })
        )
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

      if (socket?.readyState === WebSocket.OPEN && !message.isGroup) {
        socket.send(
          JSON.stringify({
            type: 'messageSeen',
            data: {
              messageId: message._id,
              sender: message.sender._id,
              receiver: account?._id
            }
          })
        )
      }
    },
    [account?._id, socket, hasConnectionLimitError, connectionLimitExceeded]
  )

  const handleMessageSeen = (data: any) => {
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
  }

  const handleMessageDelivered = (data: any) => {
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
  }

  const subscribeToGroup = useCallback(
    (groupId: string) => {
      if (
        !socket ||
        hasConnectionLimitError.current ||
        connectionLimitExceeded
      ) {
        console.log(
          'Cannot subscribe: Socket not connected or connection limit exceeded'
        )
        return
      }

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'joinGroup',
            data: { groupId }
          })
        )
        setSubscribedGroups((prev: any) => [...new Set([...prev, groupId])])
      }
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  )

  const unsubscribeFromGroup = useCallback(
    (groupId: string) => {
      if (
        !socket ||
        hasConnectionLimitError.current ||
        connectionLimitExceeded
      ) {
        console.log(
          'Cannot unsubscribe: Socket not connected or connection limit exceeded'
        )
        return
      }

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'leaveGroup',
            data: { groupId }
          })
        )
        setSubscribedGroups(prev => prev.filter(id => id !== groupId))
      }
    },
    [socket, hasConnectionLimitError, connectionLimitExceeded]
  )

  const cleanupSocketConnection = () => {
    if (socket) {
      socket.close()
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        activeUsers,
        newMessage,
        setNewMessage,
        subscribeToGroup,
        unsubscribeFromGroup,
        sendMessage,
        sendSeenStatus,
        cleanupSocketConnection,
        sendUserMessage,
        sendAdminMessage
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

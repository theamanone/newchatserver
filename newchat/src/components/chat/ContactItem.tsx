import { useAppContext } from '@/context/useContext'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import { truncateMessage } from '@/lib/truncat'
import useOutsideClick from '@/utils/documentOutSideClick'
import Image from 'next/image'
import React, { useRef, useState } from 'react'
import { AiOutlineClear } from 'react-icons/ai'
import { FiTrash } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useSocket } from '@/context/SocketContext'

type ContactItemProps = {
  _id: string;
  username: string;
  avatar?: string;
  latestMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  onClick: () => void;
  onDelete: () => void;
  onClearMessages: () => void;
  isOpen: boolean;
  setOpenItemId: (id: string | null) => void;
}

const LONG_PRESS_THRESHOLD = 500

export default function ContactItem ({
  _id,
  username,
  avatar,
  latestMessage,
  timestamp,
  unreadCount,
  onClick,
  onDelete,
  onClearMessages,
  isOpen,
  setOpenItemId
}: ContactItemProps) {
  const { isDarkMode, isMobile } = useAppContext()
  const controlsRef = useRef<HTMLDivElement | null>(null)
  const contactItemRef = useRef<HTMLDivElement | null>(null)
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number
    y: number
  }>({ x: 0, y: 0 })

  const { activeUsers } = useSocket()

  const isOnline = activeUsers.some((user) => user?._id === _id && user?.isOnline);
  
  useOutsideClick(controlsRef, () => setOpenItemId(null))

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setOpenItemId(_id)
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    longPressTimeout.current = setTimeout(() => {
      setOpenItemId(_id)
      setContextMenuPosition({ x: touch.clientX, y: touch.clientY })
    }, LONG_PRESS_THRESHOLD)
  }

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }
  }

  const renderLastMessage = () => {
    if (!latestMessage) {
      return (
        <span
          className={`text-sm ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          No messages yet
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <span
          className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          } truncate`}
        >
          {truncateMessage(latestMessage, 30)}
        </span>
      </div>
    );
  };

  return (
    <div
      ref={contactItemRef}
      className={`relative flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-all duration-300 ${
        isDarkMode ? 'hover:bg-[#ffffff0f]' : 'hover:bg-[#0000000f]'
      }`}
      onClick={onClick}
      onContextMenu={handleRightClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative">
        <Image
          src={avatar || 'https://picsum.photos/200'}
          alt={username}
          width={45}
          height={45}
          className="rounded-full object-cover"
        />
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className='flex justify-between items-center mb-0.5'>
          <h3
            className={`font-medium truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {username}
          </h3>
          <div className='flex items-center gap-2 flex-shrink-0'>
            <span
              className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {timestamp && formatRelativeTime(timestamp)}
            </span>
            {/* {unreadCount > 0 && (
              <span className='bg-green-500 text-white font-medium min-w-[20px] h-5 flex items-center justify-center text-xs rounded-full px-1.5'>
                {unreadCount < 10
                  ? unreadCount
                  : '9+'}
              </span>
            )} */}
          </div>
        </div>
        {renderLastMessage()}
      </div>

      {isOpen && (
        <motion.div
          ref={controlsRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`fixed z-20 w-48 shadow-lg rounded-lg overflow-hidden ${
            isDarkMode
              ? 'bg-dark-quaternary-color border-dark-secondary-color'
              : 'bg-white border-gray-200'
          } border`}
          style={{
            top: contextMenuPosition.y,
            left: isMobile
              ? `max(0px, min(${contextMenuPosition.x}px, calc(100vw - 12rem)))`
              : contextMenuPosition.x,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <button
            className={`w-full text-sm ${
              isDarkMode
                ? 'hover:bg-dark-quaternary-hover-color text-gray-200'
                : 'hover:bg-gray-50 text-gray-700'
            } p-3 text-left flex items-center gap-2 transition-colors`}
            onClick={e => {
              e.stopPropagation()
              onDelete()
              setOpenItemId(null)
            }}
          >
            <FiTrash className='w-4 h-4' />
            <span>Delete Conversation</span>
          </button>
          <button
            className={`w-full text-sm ${
              isDarkMode
                ? 'hover:bg-dark-quaternary-hover-color text-gray-200'
                : 'hover:bg-gray-50 text-gray-700'
            } p-3 text-left flex items-center gap-2 transition-colors`}
            onClick={e => {
              e.stopPropagation()
              onClearMessages()
              setOpenItemId(null)
            }}
          >
            <AiOutlineClear className='w-4 h-4' />
            <span>Clear Messages</span>
          </button>
        </motion.div>
      )}
    </div>
  )
}

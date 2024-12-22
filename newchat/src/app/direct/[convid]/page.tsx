'use client'
import { useEffect, useRef } from 'react'
import ChatPanel from '@/components/panels/ChatPanel'
import { useAppContext } from '@/context/useContext'
import { getSingleConversation } from '@/utils/apihandler'
import ContactPanel from '@/components/panels/ContactPanel'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'

export default function Page ({ params }: { params: { convid: string } }) {
  const router = useRouter()
  const {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    setMessages,
    loading,
    isMobile,
    currentActivePageState,
    currentActivePageHandle
  }: any = useAppContext()

  const hasFetchedRef = useRef(false)
  const searchParams = useSearchParams()
  const conversationType = searchParams.get('type')
  const userId = searchParams.get('userId')

  useEffect(() => {
    const initializeConversation = async () => {
      try {
        // If we have a userId, we're creating a new conversation
        if (userId && params.convid === 'new') {
          const response = await getSingleConversation('new', 'c', userId)
          if (response) {
            setActiveConversation(response)
            router.replace(`/direct/${response.conversation_id}?type=c`)
          }
        } else {
          // Get existing conversation
          const response = await getSingleConversation(
            params.convid,
            conversationType,
          )
          if (response) {
            setActiveConversation(response)
          }
        }
      } catch (error: any) {
        console.error('Error loading conversation:', error)
        toast.error('Unable to load conversation. Please try again.')
      }
    }

    if (!hasFetchedRef.current) {
      initializeConversation()
      hasFetchedRef.current = true
    }

    return () => {
      hasFetchedRef.current = false
    }
  }, [params.convid, conversationType, userId, setActiveConversation, currentActivePageState, router])

  // console.log("activeConversation ", activeConversation)
  useEffect(() => {
    const handleResize = () => {
      // Get the window's inner height
      const vh = window.innerHeight;
      // Set the custom property to the root element
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial height
    handleResize();

    // Add event listener for resize and orientation change
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleSendMessage = (content: {
    message: string
    type: 'text' | 'image' | 'file'
    files?: File[]
    mediaUrl?: string
  }) => {
    const newMessage = { id: Date.now().toString(), ...content, sender: 'you' }
    setMessages((prevMessages: any) => [...prevMessages, newMessage])
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p className='text-gray-400'>Loading conversation...</p>
      </div>
    )
  }

  if (!activeConversation) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p className='text-gray-400'>Starting conversation...</p>
      </div>
    )
  }

  return (
    <div className='flex h-full w-full bg-white'>
      {(!isMobile || (isMobile && currentActivePageState === 'chat')) && (
        <div className='flex-1 h-full flex flex-col relative'>
          <ChatPanel
            conv={{
              avatar:
                conversationType === 'c'
                  ? activeConversation?.otherUser?.avatar ||
                    'https://picsum.photos/200'
                  : activeConversation?.group?.group_avatar ||
                    'https://picsum.photos/200',
              username:
                conversationType === 'c'
                  ? activeConversation?.otherUser?.username || 'Unknown User'
                  : activeConversation?.group?.name || 'Group Chat',
              receiverId:
                conversationType === 'c'
                  ? activeConversation?.otherUser?._id
                  : activeConversation?.group?._id,
              lastActive: Date.now(),
              type: conversationType as any || 'c'
            }}
            messages={messages}
            onSendMessage={handleSendMessage}
            onCancelReply={() => {}}
            conversationType={conversationType as any}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentActivePageState === 'info' && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
            className={`${
              isMobile ? 'w-full fixed inset-0 z-50' : 'w-[400px]'
            } border-l border-gray-200 bg-white shadow-lg flex flex-col`}
          >
            <ContactPanel
              avatar={
                conversationType === 'c'
                  ? activeConversation?.otherUser?.avatar ||
                    'https://picsum.photos/200'
                  : activeConversation?.group?.group_avatar ||
                    'https://picsum.photos/200'
              }
              username={
                conversationType === 'c'
                  ? activeConversation?.otherUser?.username || 'Unknown User'
                  : activeConversation?.group?.group_name || 'Group Chat'
              }
              email={activeConversation?.otherUser?.email || ''}
              phone={activeConversation?.otherUser?.phone || ''}
              sharedMedia={activeConversation?.sharedMedia || []}
              onClose={() => currentActivePageHandle('chat')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

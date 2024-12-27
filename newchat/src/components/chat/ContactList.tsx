import React, { useState, useEffect, useRef } from "react";
import ContactItem from "./ContactItem";
import { useAppContext } from "@/context/useContext";
import { useRouter } from "next/navigation";
import Confirm from "../Confirm";
import { deleteConversation } from "@/utils/apihandler";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineInbox } from "react-icons/hi2";
import { Conversation } from "@/types/chat";

type ContactListProps = {
  conversations: Conversation[];
};

type ConfirmAction = {
  action: "delete" | "clear";
  otherUserId: string;
};

export default function ContactList({ conversations }: any) {
  const { setActiveConversation, currentActivePageHandle, isDarkMode } = useAppContext();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [currentOpenItemId, setCurrentOpenItemId] = useState<string | null>(null);
  const router = useRouter();
  const preloadedConversations = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Preload conversation page
  const preloadConversationPage = async (conversation: Conversation) => {
    const conversationType = conversation.type === "group" ? "gc" : "c";
    const convid = conversationType === "gc" ? conversation.group_id : conversation.conversation_id;
    const url = `/direct/${convid}?type=${conversationType}`;
    
    // Only preload if not already preloaded
    if (!preloadedConversations.current.has(url)) {
      try {
        router.prefetch(url)
        preloadedConversations.current.add(url)
      } catch (error) {
        console.error(`Failed to preload conversation: ${url}`, error)
      }
    }
  }

  // Setup intersection observer for lazy preloading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const conversationId = entry.target.getAttribute('data-conversation-id');
              const conversation = conversations.find(
                (c: Conversation) => c.conversation_id === conversationId || c.group_id === conversationId
              );
              if (conversation) {
                preloadConversationPage(conversation);
              }
            }
          });
        },
        { rootMargin: '100px' }
      );
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Preload first 3 conversations immediately
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      const conversationsToPreload = conversations.slice(0, 3);
      conversationsToPreload.forEach(preloadConversationPage);
    }
  }, [conversations]);

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    currentActivePageHandle("chat");

    const conversationType = conversation.type === "group" ? "gc" : "c";
    const convid = conversationType === "gc" ? conversation.group_id : conversation.conversation_id;
    router.push(`/direct/${convid}?type=${conversationType}`);
  };

  const handleDeleteConversation = async (otherUserId: string) => {
    await deleteConversation(otherUserId);
  };

  const handleClearMessages = async (otherUserId: string) => {
    // Implementation for clearing messages
  };

  const handleOnConfirm = () => {
    if (confirmAction) {
      const { action, otherUserId } = confirmAction;
      if (action === "delete") {
        handleDeleteConversation(otherUserId);
      } else if (action === "clear") {
        handleClearMessages(otherUserId);
      }
      setConfirmAction(null);
      setShowConfirmDialog(false);
    }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full py-12 px-4"
    >
      <div className={`p-4 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-4`}>
        <HiOutlineInbox className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
      <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
        No Conversations Yet
      </h3>
      <p className={`text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Start a new conversation by searching for users or creating a group chat.
      </p>
    </motion.div>
  );

  return (
    <div className={`overflow-y-auto flex-grow ${isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
      <Confirm
        isOpen={showConfirmDialog}
        onConfirm={handleOnConfirm}
        onCancel={() => setShowConfirmDialog(false)}
        message={
          confirmAction?.action === "delete"
            ? "Are you sure you want to delete this conversation?"
            : "Are you sure you want to clear messages in this conversation?"
        }
      />
      
      <AnimatePresence mode="wait">
        {conversations.length > 0 ? (
          conversations.map((conversation: any, index: number) => {
            const userId = conversation.type === 'group' 
              ? conversation.group_id 
              : conversation.otherUser?.user_id || conversation.otherUser?._id;
            
            return (
              <motion.div
                key={conversation.conversation_id}
                data-conversation-id={conversation.conversation_id || conversation.group_id}
                ref={(el) => {
                  if (el && observerRef.current) {
                    observerRef.current.observe(el);
                  }
                }}
                variants={itemVariants}
                layout
              >
                <ContactItem
                  _id={userId}
                  username={conversation.type === 'group' ? conversation.groupName || 'Group Chat' : conversation.otherUser?.username || 'Unknown User'}
                  avatar={conversation.type === 'group' ? conversation.groupImage : conversation.otherUser?.avatar}
                  latestMessage={conversation.latestMessage?.text}
                  timestamp={conversation.latestMessage?.timestamp}
                  unreadCount={conversation.unreadCount}
                  onClick={() => handleSelectConversation(conversation)}
                  onDelete={() => {
                    setConfirmAction({
                      action: "delete",
                      otherUserId: conversation.otherUser?.user_id || '',
                    });
                    setShowConfirmDialog(true);
                  }}
                  onClearMessages={() => {
                    setConfirmAction({
                      action: "clear",
                      otherUserId: conversation.otherUser?.user_id || '',
                    });
                    setShowConfirmDialog(true);
                  }}
                  isOpen={currentOpenItemId === conversation.conversation_id}
                  setOpenItemId={setCurrentOpenItemId}
                />
              </motion.div>
            );
          })
        ) : (
          <EmptyState />
        )}
      </AnimatePresence>
    </div>
  );
}

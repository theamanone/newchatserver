"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ChatHeader from "../chat/ChatHeader";
import Input from "../chat/Input";
import Message from "../chat/Message";
import axios from "axios";
import { HiArrowDown } from "react-icons/hi";
import { useChatStore } from "@/store/chatStore";
import { debounce } from "lodash";
import { useAppContext } from "@/context/useContext";
import { formatDate } from "@/utils/dateUtils";
import { fetchMessages } from "@/utils/apihandler";
import axiosInstance from "@/utils/axiosInstance";
import { useSocket } from "@/context/SocketContext";

// message.ts
export interface Message {
  _id: string;
  content: string;
  messageType:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "voice"
    | "document"
    | "gif"
    | "link"
    | "file";
  sender: any;
  receiver?: string;
  groupId?: string;
  isGroup?: boolean;
  mediaUrl?: string;
  fileType?: string;
  timestamp: string;
  error?: string;
  isLoading?: boolean;
  isYour: boolean;
}

interface ChatPanelProps {
  conv: {
    avatar: string;
    username: string;
    receiverId: string;
    lastActive: any;
    type: 'direct' | 'group';
  };
  messages: Message[];
  onSendMessage: (content: any) => void;
  onCancelReply: () => void;
  conversationType: 'c' | 'gc'
}

export default function ChatPanel({ conv, conversationType }: ChatPanelProps) {
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef<boolean>(false);

  const [messageReply, setMessageReply] = useState([
    {
      _id: "",
      content: "",
      messageType: "",
      sender: "",
      mediaUrl: "",
      timestamp: "",
      error: "",
      isLoading: false,
      isYour: false,
    },
  ]);

  const {
    setConversations,
    setActiveConversation,
    account,
    isMobile,
    isDarkMode,
  } = useAppContext();

  const { sendMessage, newMessage, setNewMessage, sendSeenStatus }: any = useSocket()

  useEffect(() => {
    // console.log("repy msg : ", messageReply);
  }, [messageReply]);

  useEffect(() => {
    if (newMessage && conv?.receiverId) {
      console.log("Processing new message in ChatPanel:", newMessage);
      // Check if the message belongs to this conversation
      console.log("conversationtype : in chat panel for new message proccessing : ", conversationType)
      /* 
      {
    "_id": "6757f1edbe6ce2cbe575c437",
    "content": "77888",
    "messageType": "text",
    "mediaUrl": null,
    "sender": {
        "_id": "670560d3e79e6b11ca0a221e",
        "username": "ashu",
        "avatar": ""
    },
    "groupId": "672db6aef5679bd6723a9a9e",
    "timestamp": "2024-12-10T07:46:53.921Z",
    "status": [],
    "isGroup": true
} */
      const isForThisConversation = conversationType === 'gc'
        ? newMessage.groupId === conv.receiverId
        : (newMessage.sender?._id === conv.receiverId && newMessage.receiver === account?._id) || 
          (newMessage.sender?._id === account?._id && newMessage.receiver === conv.receiverId);

          console.log("isforthisconversation : ", isForThisConversation)
      if (isForThisConversation) {
        setMessages((prevMessages) => {
          // Check if message already exists
          if (prevMessages.some(msg => msg._id === newMessage._id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });

        // Send seen status only for direct messages from other users
        if (
          conversationType === 'c' && 
          newMessage.sender?._id !== account?._id && 
          sendSeenStatus
        ) {
          sendSeenStatus(newMessage);
        }

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          setNewMessage(null)
        }, 100);
      }
    }
  }, [newMessage, conv?.receiverId, account?._id, conversationType, sendSeenStatus]);

  const fetchCompletedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!fetchCompletedRef.current && conv.receiverId) {
      fetchMessagesForChat(1);
      fetchCompletedRef.current = true;
    }
  }, [conv.receiverId]);

  const fetchMessagesForChat = async (pageNumber: number) => {
    if (loadingRef.current || !hasMoreMessages) return;
    loadingRef.current = true;

    try {
      const response: any = await fetchMessages(conv.receiverId, pageNumber, conversationType);

      if (response.messages.length === 0) {
        setHasMoreMessages(false); // Stop fetching if no more messages
        return;
      }

      setMessages((prevMessages) => {
        const existingMessageIds = new Set(prevMessages.map((msg) => msg._id));
        const uniqueMessages = response.messages.filter((msg: any) => !existingMessageIds.has(msg._id));
        return [...uniqueMessages, ...prevMessages]; // Prepend older messages
      });

      setPage(pageNumber);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to fetch messages.");
    } finally {
      loadingRef.current = false;
    }
  };

  const handleSendMessage = async (content: any) => {
    if (!content.message && !content.files) {
      setError("You must enter a message or upload a file.");
      return;
    }

    const newMessages: Message[] = [];
    const messageId = Date.now().toString(); // Temporary ID for optimistic messages

    // Create optimistic messages for files
    if (content.files) {
      content.files.forEach((file: File) => {
        const newMessage: Message = {
          _id: messageId, // Temporary ID
          sender: content.isYour,
          content: "", // No text content for files
          messageType: content.type,
          fileType: file.type,
          timestamp: new Date().toISOString(),
          isLoading: true, // Optimistic loading flag
          mediaUrl: URL.createObjectURL(file), // Temporary Blob URL for preview
          isYour: content.isYour,
          isGroup: conversationType === "gc" as any,
        };
        newMessages.push(newMessage);
      });
    }

    // Create optimistic message for text
    if (content.message) {
      const textMessage: Message = {
        _id: messageId,
        sender: content.isYour,
        content: content.message,
        messageType: content.type,
        timestamp: new Date().toISOString(),
        isLoading: true, // Optimistic loading flag
        isYour: content.isYour,
        isGroup: conversationType === "gc" as any,
      };
      newMessages.push(textMessage);
    }

    // Add optimistic messages to state
    setMessages((prevMessages) => [...prevMessages, ...newMessages]);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("message", content.message || "");
      formData.append("messageType", content.type);
      formData.append("receiver", conv.receiverId);
      const isGroup = conversationType === "gc" as any;
      formData.append("isGroup", isGroup.toString());
      
      // For group chat, we use groupId instead of receiver
      if (isGroup) {
        formData.append("groupId", conv.receiverId);
      }

      if (content.files) {
        content.files.forEach((file: File, index: number) => {
          formData.append(`file_${index}`, file);
        });
      }

      const response = await axiosInstance.post("/api/v1/conversation/chat", formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) { 
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // Update progress for optimistic messages
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg._id === messageId
                  ? { ...msg, uploadProgress: percentCompleted }
                  : msg
              )
            );
          }
        },
      });

      if (response.status === 201) {
        const apiMessage = response.data.data;
        // Update the optimistic message with the actual API response
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? {
                ...msg,
                _id: apiMessage._id, // Replace temporary ID with real ID
                isLoading: false, // Mark as successfully sent
                mediaUrl: apiMessage.mediaUrl || msg.mediaUrl, // Update media URL if provided
                content: apiMessage.content || msg.content, // Update content if provided
                timestamp: apiMessage.timestamp, // Update timestamp
                status: apiMessage.status, // Update status array
                isGroup,
              }
              : msg
          )
        );

        
        // Send to socket after successful API save
        const messagePayload = {
          _id: apiMessage._id,
          content: apiMessage.content,
          messageType: apiMessage.messageType,
          mediaUrl: apiMessage.mediaUrl,
          sender: {
            _id: account?._id,
            username: account?.username,
            avatar: account?.avatar,
          },
          receiver: isGroup ? undefined : conv.receiverId,
          groupId: isGroup ? conv.receiverId : undefined,
          timestamp: apiMessage.timestamp,
          status: isGroup ? [] : [
            {
              userId: conv.receiverId,
              status: "sent",
              timestamp: Date.now(),
            }
          ],
          isGroup,
        };
    
        sendMessage(messagePayload);

        // Update conversations and active conversation with the new last message
        const createLastMessage = (content: any, isYour: boolean) => ({
          content: content.message || "File sent",
          messageType: content.type,
          timestamp: apiMessage.timestamp,
          sender: { 
            _id: isYour ? account?._id : undefined,
            username: account?.username,
            avatar: account?.avatar,
          },
          isGroup,
        });

        setConversations((prevConversations) =>
          prevConversations.map((conversation:any) => {
            const isMatch = isGroup 
              ? conversation.group?._id === conv.receiverId
              : conversation.user2_id === conv.receiverId;
            
            if (isMatch) {
              const lastMessage = createLastMessage(content, content.isYour);
              return { ...conversation, lastMessage };
            }
            return conversation;
          })
        );

        setActiveConversation((prevActiveConv: any) => {
          const isMatch = isGroup
            ? prevActiveConv.group?._id === conv.receiverId
            : prevActiveConv.user2_id === conv.receiverId;
          
          if (isMatch) {
            const lastMessage = createLastMessage(content, content.isYour);
            return { ...prevActiveConv, lastMessage };
          }
          return prevActiveConv;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
      // Update the optimistic message to show error
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId
            ? { ...msg, isLoading: false, error: "Failed to send" }
            : msg
        )
      );
    }
  };

  const onCancelReply = () => {
    setMessageReply([
      {
        _id: "",
        content: "",
        messageType: "",
        sender: "",
        mediaUrl: "",
        timestamp: "",
        error: "",
        isLoading: false,
        isYour: false,
      },
    ]);
  };

  useEffect(() => {
    fetchMessagesForChat(page); // Fetch messages on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, conv]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleScroll = useCallback(
    debounce((e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;

      // Ensure target is not null before accessing scrollTop
      if (target) {
        const { scrollTop } = target;

        if (scrollTop < 100 && !loadingRef.current && hasMoreMessages) {
          setPage((prevPage) => prevPage + 1); // Increment page when scrolled near top
        }

        const container = messagesContainerRef.current;
        if (container) {
          const clientHeight = container.clientHeight;
          const scrollHeight = container.scrollHeight;
          setShowScrollToBottom(scrollTop + clientHeight < scrollHeight - 20);
        }
      }
    }, 200),
    [hasMoreMessages] // Dependencies
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom(); // Scroll to bottom when messages update
  }, [messages]);

  // on ESC button press / event listener for ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancelReply();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const markMessageAsSeen = async (messageId: string, receiverId: string) => {
    try {
      // API call to mark the message as seen
      const response = await axiosInstance.patch(`/api/v1/conversation/chat/message/${messageId}/seen?receiverId=${receiverId}`);

      if (response.status === 200) {
        // Update the UI to reflect the "seen" status
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId ? { ...msg, status: "seen" } : msg
          )
        );

        // Emit socket event to notify sender
        const messagePayload = {
          messageId,
          senderId: conv.receiverId, // Replace with sender's ID
          receiverId: account?._id, // Replace with your ID
        };
        // sendMessage({ type: "message-seen", payload: messagePayload });
        sendSeenStatus(messagePayload)
      }
    } catch (error) {
      console.error("Failed to mark message as seen:", error);
    }
  };

  return (
    <>
      <style jsx>{`
        .background-container {
          background-image: linear-gradient(to top left, #1f2937c8, #1f2937),
            url("/assets/chatwallpapers/chat-bg5.jpg");
        }
      `}</style>
      <div
        className={` max-h-screen ${isDarkMode
          ? "bg-[url('/assets/chatwallpapers/dark_chat_bg.jpg')]"
          : "bg-[url('/assets/chatwallpapers/light_chat_bg.png')]"
          } 
         ${isMobile && "w-screen background-container "
          } !w-full  bg-gray-800 flex flex-col justify-between h-screen relative
        `}
      >
        <ChatHeader conv={conv} />

        <div
          className={`flex-grow px-3 overflow-y-auto p-4 ${isMobile && "pt-[4.3rem]"} pt-[4.3rem] scrollbar scrollbar-hide`}
          style={{ height: "calc(100vh - 8.6rem)" }}
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          <div className=" w-full flex flex-col mb-4">
            {messages.length > 0 ? (
              messages.map((msg: any, index) => {
                const showDateSeparator =
                  index === 0 ||
                  formatDate(msg.timestamp) !==
                  formatDate(messages[index - 1].timestamp);

                return (
                  <React.Fragment key={msg._id || index}>
                    {showDateSeparator && (
                      <p className="sticky top-0 left-0 z-[1] flex items-center justify-center text-center my-1 mb-3">
                        <span
                          className={` ${isDarkMode
                            ? "bg-dark-tertiary-color text-white"
                            : "bg-light-quaternary-color text-black"
                            } min-w-[12%] text-xs p-0.5 px-3 rounded`}
                        >
                          {formatDate(msg?.timestamp)}
                        </span>
                      </p>
                    )}
                    <Message
                      message={msg}
                      setMessages={setMessages}
                      setMessageReply={setMessageReply}
                      messageReply={messageReply}
                      markAsSeen={markMessageAsSeen}
                    />
                  </React.Fragment>
                );
              })
            ) : (
              <p className="text-gray-400">No messages yet</p>
            )}
          </div>
          {/* {error && <p className="text-red-500">{error}</p>} */}
          {/* {uploadProgress !== null  && (
          // <p className="text-green-500">Uploading: {uploadProgress}%</p>
        )} */}
          <div ref={messagesEndRef} />
        </div>

        <Input
          onSendMessage={handleSendMessage}
          messageReply={messageReply}
          handleCancelReply={onCancelReply}
        />
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-20 right-4 z-10 bg-gray-700 text-white rounded-full p-2 shadow-md hover:bg-gray-600 transition duration-300"
            aria-label="Scroll to bottom"
          >
            <HiArrowDown size={24} />
          </button>
        )}
      </div>
    </>
  );
}

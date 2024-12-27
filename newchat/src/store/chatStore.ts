import { create } from "zustand";

type Message = {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
};

type Conversation = {
  _id: string;
  participants: string[];
  latestMessage: Message | null;
  deletedBy: string[];
  createdAt: string;
  updatedAt: string;
};

type ChatState = {
  messages: Message[];
  conversations: Conversation[];
  hasMoreMessages: boolean;
  hasMoreConversations: boolean;
  loadingMessages: boolean;
  loadingConversations: boolean;
  // fetchMessages: (page: number, receiver_id: string) => Promise<void>;
  fetchConversations: (page: number) => Promise<void>;
  sendMessage: (convid: string, message: string) => Promise<void>;
  fetchConversation: (convid: string) => Promise<void>; // New fetchConversation method
  conversation: Conversation | null; // New state for conversation
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversations: [],
  hasMoreMessages: true,
  hasMoreConversations: true,
  loadingMessages: false,
  loadingConversations: false,
  conversation: null,

  // Fetch paginated conversations
  fetchConversations: async (page: number) => {
    const cacheKey = `conversations-${page}`;
    const cachedConversations = sessionStorage.getItem(cacheKey);

    // if (cachedConversations) {
    //   // Use cached conversations if available
    //   const parsedConversations = JSON.parse(cachedConversations);
    //   set((state) => ({
    //     conversations: [...state.conversations, ...parsedConversations],
    //   }));
    //   return; // Exit early if conversations are cached
    // }

    set({ loadingConversations: true });
    try {
      const response = await fetch(`/api/v1/conversation?page=${page}`);
      const data = await response.json();

      // Create a set to keep track of existing conversation IDs
      const existingIds = new Set(get().conversations.map((conv) => conv._id));

      // Filter out duplicates based on the conversation ID
      const newConversations = data.conversations.filter(
        (conv: Conversation) => !existingIds.has(conv._id)
      );

      if (newConversations.length === 0) {
        set({ hasMoreConversations: false });
      }

      set((state) => {
        const updatedConversations = [...state.conversations, ...newConversations];
        // sessionStorage.setItem(cacheKey, JSON.stringify(newConversations)); // Cache the new conversations
        return {
          conversations: updatedConversations,
          loadingConversations: false,
        };
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      set({ loadingConversations: false });
    }
  },

  // Fetch paginated messages for a specific conversation
//   fetchMessages: async (page: number, receiver_id: string) => {
//     const cacheKey = `messages-${receiver_id}-${page}`;
//     const cachedMessages = sessionStorage.getItem(cacheKey);
//     set({ loadingMessages: true }); // Set loading state to true before fetching

//     // Check if cached messages are available
//     // if (cachedMessages) {
//     //     const parsedMessages = JSON.parse(cachedMessages);
//     //     console.log("Using cached messages:", parsedMessages);
        
//     //     set((state) => {
//     //         const updatedMessages = [...state.messages, ...parsedMessages]; 
//     //         return {
//     //             messages: updatedMessages,
//     //             loadingMessages: false,
//     //         };
//     //     });
        
//     //     return; // Exit early if messages are cached
//     // }

//     try {
//         // Fetch new messages from the API
//         const response = await fetch(
//             `/api/v1/conversation/chat/message?page=${page}&limit=20`,
//             {
//                 headers: {
//                     receiver_id: receiver_id,
//                 },
//             }
//         );

//         const data = await response.json();

//         // Check if no messages were returned
//         if (data.messages.length === 0) {
//             set({ hasMoreMessages: false });
//         }

//         // Update the state with the new messages
//         set((state) => {
//             const updatedMessages = [...state.messages, ...data.messages];
//             // Optionally cache the new messages
//             // sessionStorage.setItem(cacheKey, JSON.stringify(data.messages)); 
//             return {
//                 messages: updatedMessages,
//                 loadingMessages: false,
//             };
//         });
//     } catch (error) {
//         console.error("Error fetching messages:", error);
//         set({ loadingMessages: false }); // Ensure loading state is reset on error
//     }
// },

  
  

   // Fetch a single conversation
   fetchConversation: async (convid: string) => {
    set({ loadingMessages: true }); // Set loading state
    try {
      const response = await fetch(`/api/v1/conversation/${convid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      const data = await response.json();
      set({ conversation: data, messages: data.latestMessages || [] }); // Update conversation and messages
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      set({ loadingMessages: false }); // Reset loading state
    }
  },

  // Send new message
  sendMessage: async (convid: string, message: string) => {
    try {
      const response = await fetch(`/api/v1/conversation/${convid}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const newMessage = await response.json();
      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    } catch (error) {
      console.error("Error sending message:", error);
    }
  },
}));

"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getConversations, getLoggedInUser } from "@/utils/apihandler";

interface User {
  user_id: number;
  name: string;
  avatar?: string;
}

interface Conversation {
  conversation_id: number;
  user_id: number;
  user2_id: number;
  last_message_timestamp: string;
}

interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  message_content: string;
  timestamp: string;
}

interface Contact {
  contact_id: number;
  contact_name: string;
  user_id: number;
}

interface AppContextProps {
  account: any | null;
  setAccount: React.Dispatch<React.SetStateAction<any | null>>;
  activeConversation: any | null;
  setActiveConversation: React.Dispatch<React.SetStateAction<any | null>>;
  activeUsers: User[];
  setActiveUsers: React.Dispatch<React.SetStateAction<User[]>>;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  setcurrentActivePageState: React.Dispatch<React.SetStateAction<string>>;
  currentActivePageState: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  loading: boolean;
  isMobile: boolean;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [account, setAccount] = useState<any | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [activeConversation, setActiveConversation] = useState();
  const [isMobile, setIsMobile] = useState(false);
  const [currentActivePageState, setcurrentActivePageState] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    localStorage.setItem("theme", isDarkMode ? "light" : "dark");
  };

  const handleLogout = () => {
    // Clear all session storage
    sessionStorage.clear();
    
    // Clear all local storage related to the app
    localStorage.removeItem("theme");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("conversations");
    
    // Clear all states
    setAccount(null);
    setActiveUsers([]);
    setConversations([]);
    setMessages([]);
    setContacts([]);
    setIsLoggedIn(false);
    setActiveConversation(undefined);

    // Redirect to login page
    window.location.href = '/auth/signin';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if the account data is already stored in sessionStorage
        const storedUser = sessionStorage.getItem("account");

        if (storedUser) {
          // Use the stored account from sessionStorage
          setAccount(JSON.parse(storedUser));
          setIsLoggedIn(true); // User is logged in if data exists in sessionStorage
        } else {
          // Fetch user data from API if not present in sessionStorage
          const userResponse = await getLoggedInUser();

          if (userResponse?.data?.user) {
            // Store user data in state and sessionStorage
            setAccount(userResponse.data.user);
            sessionStorage.setItem(
              "account",
              JSON.stringify(userResponse.data.user)
            );
            setIsLoggedIn(true);
          } else {
            // If the user data is not present, handle accordingly
            setAccount(null);
            setIsLoggedIn(false);
          }
        }

        // Fetch conversations regardless of account status
        const conversationResponse = await getConversations(1);
        if (conversationResponse?.conversations) {
          setConversations(conversationResponse.conversations);
        }

        // Uncomment and handle the contacts fetching logic if necessary
        // const contactResponse:any = await getContacts();
        // setContacts(contactResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setAccount(null); // Reset the account if an error occurs
        setIsLoggedIn(false); // Mark user as logged out on error
      }
    };

    // Call fetchData only once when the component mounts
    fetchData();
  }, []);

  // Detect if the device is mobile
  const checkIsMobile = () => {
    setIsMobile(window.innerWidth <= 768); // Threshold for mobile devices
  };

  useEffect(() => {
    checkIsMobile(); // Initial check

    // Add event listener to handle resize and detect changes
    const handleResize = () => checkIsMobile();
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AppContext.Provider
      value={{
        account,
        setAccount,
        activeConversation,
        setActiveConversation,
        activeUsers,
        setActiveUsers,
        conversations,
        setConversations,
        messages,
        setMessages,
        contacts,
        setContacts,
        isDarkMode,
        toggleDarkMode,
        loading,
        isMobile,
        currentActivePageState,
        setcurrentActivePageState,
        isLoggedIn,
        setIsLoggedIn,
        handleLogout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

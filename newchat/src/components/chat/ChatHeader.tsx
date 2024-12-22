import { useSocket } from "@/context/SocketContext";
import { useAppContext } from "@/context/useContext";
import Image from "next/image";
import React from "react";
import { IoChevronBack, IoEllipsisVertical, IoInformationCircleOutline } from "react-icons/io5";
import { motion } from "framer-motion";

interface ChatHeaderProps {
  conv: {
    avatar: string;
    username: string;
    receiverId: string;
    lastActive: number;
    type?: any;
  };
  onContactInfoClick?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ conv, onContactInfoClick }) => {
  const { isMobile, currentActivePageHandle, isDarkMode } = useAppContext();
  const { activeUsers } = useSocket();


  if (!conv?.receiverId) return null;

  const isOnline = conv.type === 'c' && activeUsers.some(
    (user) => user._id === conv?.receiverId && user.isOnline
  );

  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    currentActivePageHandle("home");
  };

  const handleHeaderClick = () => {
    currentActivePageHandle("info");
  };

  return (
    <div
      onClick={handleHeaderClick}
      className={`fixed top-0 z-30 w-full h-[4.3rem] min-h-[4.3rem]  ${
        isDarkMode
          ? "bg-gray-900 text-gray-100 border-gray-800"
          : "bg-white text-gray-900 border-gray-200"
      } flex items-center justify-between border-b px-4 py-3 shadow-sm`}
    >
      <div className="flex items-center space-x-3">
        {isMobile && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBackClick}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <IoChevronBack className="w-6 h-6" />
          </motion.button>
        )}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Image
              src={conv?.avatar || "/default-avatar.png"}
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full"
            />
            {conv.type === 'c' && isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{conv?.username || "User"}</h2>
            {conv.type === 'c' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isOnline ? "Online" : "Offline"}
              </p>
            )}
            {conv.type === 'gc' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Group Chat
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onContactInfoClick}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <IoInformationCircleOutline className="w-6 h-6" />
        </motion.button>
        {/* <motion.button
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <IoEllipsisVertical className="w-6 h-6" />
        </motion.button> */}
      </div>
    </div>
  );
};

export default ChatHeader;

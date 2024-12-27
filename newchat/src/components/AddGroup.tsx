import { useAppContext } from "@/context/useContext";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { IoClose, IoSearch, IoCheckmarkCircle, IoAlertCircle } from "react-icons/io5";
import { createGroup } from "@/utils/apihandler";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "./chat/common/Modal";

export default function AddGroupUI({ onClose }: { onClose: () => void }) {
  const { conversations, account, isDarkMode } = useAppContext();
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGroupCreated, setIsGroupCreated] = useState(false);

  const MAX_MEMBERS = 10;

  useEffect(() => {
    if (searchQuery.trim()) {
      console.log("Search Query:", searchQuery);
  
      const otherUsers = conversations
        .flatMap((conversation: any) => conversation.otherUser ? [conversation.otherUser] : [])
        .filter(Boolean);
  
      console.log("Other Users:", otherUsers);
  
      const filteredUsers = otherUsers.filter((user: any) => {
        const isNotCurrentUser = user?._id !== account?._id;
        const isNotSelected = !selectedMembers.includes(user.user_id);
        const matchesQuery = user?.username.toLowerCase().includes(searchQuery.toLowerCase());
  
        return isNotCurrentUser && isNotSelected && matchesQuery;
      });
  
      console.log("Filtered Users:", filteredUsers);
  
      setFilteredMembers(filteredUsers);
    } else {
      console.log("Search Query is empty");
      setFilteredMembers([]);
    }
  }, [searchQuery, conversations, account._id, selectedMembers]);
  
  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
    setError(null);
  };

  const handleMemberSelection = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : prev.length < MAX_MEMBERS
        ? [...prev, userId]
        : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) {
      setError("Please provide a group name.");
      return;
    }
    if (selectedMembers.length === 0) {
      setError("Please select at least one member.");
      return;
    }
    const response = await createGroup(groupName, selectedMembers);
    if (!response) {
      setError("Failed to create group. Please try again.");
      return;
    }

    setGroupName("");
    setSelectedMembers([]);
    setError(null);
    setIsGroupCreated(true);
  };

  const handleClosePopup = () => {
    setIsGroupCreated(false);
    onClose();
  };

  return (
    <Modal visible={true} onClose={onClose} isDarkMode={isDarkMode} width="md" height="auto">
      <div className="p-6">
        <h3 className={`text-2xl font-semibold mb-6 ${
          isDarkMode ? "text-gray-100" : "text-gray-900"
        }`}>
          New Group
        </h3>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-100/40 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            >
              <IoAlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group Name Input */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}>
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={handleGroupNameChange}
            className={`w-full p-3 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200`}
            placeholder="Enter group name"
          />
        </div>

        {/* Member Search */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}>
            Add Members
          </label>
          <div className="relative">
            <IoSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200`}
              placeholder="Search members"
            />
          </div>
        </div>

        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <div className="mb-4">
            <div className={`text-sm font-medium mb-2 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>
              Selected ({selectedMembers.length}/{MAX_MEMBERS})
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map(userId => {
                const user = conversations
                  .flatMap((conversation: any) => [conversation.otherUser])
                  .find((user: any) => user.user_id === userId);

                return (
                  <motion.div
                    key={user.user_id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                      isDarkMode
                        ? "bg-gray-800 text-gray-200"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <Image
                      src={user?.avatar || "https://picsum.photos/200/300?random=10"}
                      alt={user?.username}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium">{user.username}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleMemberSelection(user.user_id)}
                      className={`p-1 rounded-full ${
                        isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                      }`}
                    >
                      <IoClose className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Member List */}
        <div className={`mb-6 overflow-hidden rounded-lg border ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}>
          <AnimatePresence>
            {filteredMembers.length > 0 && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="max-h-64 overflow-y-auto"
              >
                {filteredMembers.map((user: any) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{
                      backgroundColor: isDarkMode
                        ? "rgba(55, 65, 81, 0.5)"
                        : "rgba(243, 244, 246, 0.5)"
                    }}
                    className={`flex items-center gap-3 p-3 cursor-pointer ${
                      isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
                    } transition-colors duration-200`}
                    onClick={() => handleMemberSelection(user.user_id)}
                  >
                    <Image
                      src={user?.avatar || "https://picsum.photos/200/300?random=10"}
                      alt={user?.username}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}>
                        {user.username}
                      </p>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{
                        scale: selectedMembers.includes(user.user_id) ? 1 : 0
                      }}
                      className="text-blue-500"
                    >
                      <IoCheckmarkCircle className="w-6 h-6" />
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Create Button */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className={`px-6 py-3 rounded-lg font-medium ${
              groupName && selectedMembers.length > 0
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            } transition-colors duration-200`}
            disabled={!groupName || selectedMembers.length === 0}
          >
            Create Group
          </motion.button>
        </div>

        <AnimatePresence>
          {isGroupCreated && (
            <Modal visible={true} onClose={handleClosePopup} isDarkMode={isDarkMode} width="sm">
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                      <IoCheckmarkCircle className="w-10 h-10 text-green-500" />
                    </div>
                  </motion.div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}>
                    Success!
                  </h3>
                  <p className={`mb-6 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Your group has been created successfully.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClosePopup}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

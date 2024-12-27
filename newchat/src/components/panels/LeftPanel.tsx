"use client";
import { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/context/useContext";
import ContactList from "../chat/ContactList";
import { PiUserCircleGearLight } from "react-icons/pi";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { HiOutlineUserGroup } from "react-icons/hi2";
import Search from "../chat/common/search/Search";
import SearchResults from "../chat/common/search/SearchResults";
import SettingsUI from "../Settings";
import AccountInfoUI from "../AccountInfo";
import AddGroupUI from "../AddGroup";
import Modal from "../chat/common/Modal";
import useOutsideClick from "@/utils/documentOutSideClick";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

// Menu item component for better reusability
const MenuItem = ({ icon: Icon, label, onClick, isDanger = false, isDarkMode }: {
  icon: any;
  label: string;
  onClick: () => void;
  isDanger?: boolean;
  isDarkMode?: boolean;
}) => (
  <motion.button
    whileHover={{ x: 4 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      isDarkMode
        ? `hover:bg-gray-700 ${isDanger ? 'text-red-400 hover:text-red-3100' : 'text-gray-300 hover:text-white'}`
        : `hover:bg-gray-100 ${isDanger ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-gray-900'}`
    }`}
  >
    <Icon className="text-lg" />
    <span className="text-sm font-medium">{label}</span>
  </motion.button>
);

// Enhanced MenuDropdown component
const MenuDropdown = ({ visible, onSelect, isDarkMode, isMobile, profileLoaded }: {
  visible: boolean;
  onSelect: (dialog: string) => void;
  isDarkMode?: boolean;
  isMobile?: boolean;
  profileLoaded?: boolean;
}) => {
  const router = useRouter();
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  // Preload profile page when menu is opened
  useEffect(() => {
    const preloadProfile = async () => {
      if (visible && !profileLoaded) {
        try {
          console.log('Preloading profile from menu dropdown...')
          router.prefetch('/profile')
          console.log('Profile preloaded successfully from menu')
        } catch (error) {
          console.error('Failed to preload profile:', error)
        }
      }
    }
    preloadProfile()
  }, [visible, router, profileLoaded])

  const handleProfileClick = () => {
    if (!profileLoaded) {
      console.log('Profile not preloaded, using regular navigation')
      router.push('/profile')
    } else {
      console.log('Profile preloaded, using soft navigation')
      router.push('/profile')
    }
  }

  const handleLogout = async () => {
    try {
      signOut({ callbackUrl: "/auth/signin" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={dropdownVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`absolute top-12 ${
            isMobile ? "right-0" : "right-0"
          } w-56 py-2 rounded-xl shadow-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } z-30`}
        >
          <div className="space-y-1 px-2">
            <MenuItem
              icon={IoSettingsOutline}
              label="Settings"
              onClick={() => onSelect("settings")}
              isDarkMode={isDarkMode}
            />
            <MenuItem
              icon={CgProfile}
              label="Profile"
              onClick={handleProfileClick}
              isDarkMode={isDarkMode}
            />
            <MenuItem
              icon={HiOutlineUserGroup}
              label="Create New Group"
              onClick={() => onSelect("addGroup")}
              isDarkMode={isDarkMode}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function LeftPanel() {
  const { conversations, loading, isMobile, isDarkMode } = useAppContext();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const menuDropdownRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const initialProfileLoaded = useRef(false);

  // Preload profile page when component mounts
  useEffect(() => {
    const preloadProfile = async () => {
      if (!initialProfileLoaded.current) {
        try {
          console.log('Initial profile preload starting...')
          router.prefetch('/profile')
          initialProfileLoaded.current = true
          console.log('Initial profile preload successful')
        } catch (error) {
          console.error('Failed to preload profile:', error)
        }
      }
    }
    preloadProfile()
  }, [router])

  // Share the preload status with MenuDropdown
  useEffect(() => {
    if (initialProfileLoaded.current && menuDropdownRef.current) {
      const menuDropdown = menuDropdownRef.current as any;
      if (menuDropdown.profileLoaded) {
        menuDropdown.profileLoaded.current = true;
      }
    }
  }, [showMenu])

  useOutsideClick(menuDropdownRef, () => setShowMenu(false));

  const handleScroll = () => {
    if (panelRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = panelRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 50 && !loading) {
        fetchMoreConversations();
      }
    }
  };

  const fetchMoreConversations = async () => {
    // Logic to load more conversations
  };

  useEffect(() => {
    const panel = panelRef.current;
    if (panel) {
      panel.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (panel) {
        panel.removeEventListener("scroll", handleScroll);
      }
    };
  }, [conversations, loading]);

  const handleDialogOpen = (dialogName: string) => {
    setActiveDialog(dialogName);
    setShowModal(true);
    setShowMenu(false);
  };

  const renderModalContent = () => {
    const closeModal = () => setShowModal(false);
  
    switch (activeDialog) {
      case "settings":
        return <SettingsUI onClose={closeModal} />;
      case "profile":
        return <AccountInfoUI onClose={closeModal} />;
      case "addGroup":
        return <AddGroupUI onClose={closeModal} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative flex flex-col h-screen ${
        isMobile ? "w-full p-2" : "w-1/4 min-w-[320px] max-w-[400px] p-4"
      } ${
        isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
      } border-r`}
    >
      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        isDarkMode={isDarkMode}
      >
        {renderModalContent()}
      </Modal>

      <div className={`sticky top-0 z-20 ${isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-lg pb-4`}>

        <div className="w-[95%] mx-auto flex justify-between items-center py-3">
          <div className="flex items-center gap-3">
            <HiOutlineChatBubbleLeftRight className={`text-2xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Chats
            </h2>
          </div>
          <div className="relative" ref={menuDropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMenu((prev) => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
              }`}
            >
              <PiUserCircleGearLight className="text-2xl" />
            </motion.button>
            <MenuDropdown
              visible={showMenu}
              onSelect={handleDialogOpen}
              isDarkMode={isDarkMode}
              isMobile={isMobile}
              profileLoaded={initialProfileLoaded.current}
            />
          </div>
        </div>

        <div className="relative">
          <Search searchType="contact" setSearchQuery={setSearchQuery} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {searchQuery.trim().length > 2 ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SearchResults
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onClose={() => setSearchQuery("")}
              />
            </motion.div>
          ) : (
            <motion.div
              key="contact-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ContactList conversations={conversations} />
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex justify-center py-4 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

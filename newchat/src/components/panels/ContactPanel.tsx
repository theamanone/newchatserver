import { useAppContext } from "@/context/useContext";
import Image from "next/image";
import { useState } from "react";
import { IoClose, IoArrowBack, IoImageOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import FullscreenMediaPreview from "../chat/common/FullscreenMediaPreview";

interface ContactPanelProps {
  avatar: string;
  username: string;
  email: string;
  phone: string;
  sharedMedia: string[];
  onClose: () => void;
}

export default function ContactPanel({
  avatar,
  username,
  email,
  phone,
  sharedMedia,
  onClose,
}: ContactPanelProps) {
  const { isMobile, isDarkMode } = useAppContext();
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  const panelVariants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200,
      }
    },
    exit: { 
      x: "-100%", 
      opacity: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200,
      }
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleMediaClick = (mediaUrl: string) => {
    setSelectedMedia(mediaUrl);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={panelVariants}
          className={`h-screen ${
            isMobile ? "w-full" : "w-[400px]"
          } ${
            isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
          } border-l flex flex-col`}
        >
          {/* Header - matched with ChatHeader height */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={` h-[4.3rem]   ${
              isMobile ? "sticky top-0 z-30" : ""
            } select-none ${
              isDarkMode
                ? "bg-gray-900 text-gray-100 border-gray-800"
                : "bg-white text-gray-900 border-gray-200"
            } flex items-center justify-between border-b px-4 py-3 shadow-sm`}
          >
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className={`p-1.5 rounded-full ${
                  isDarkMode
                    ? "hover:bg-gray-800 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                {isMobile ? (
                  <IoArrowBack className="w-5 h-5" />
                ) : (
                  <IoClose className="w-5 h-5" />
                )}
              </motion.button>
              <h2 className={`text-lg font-medium ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}>
                Contact Information
              </h2>
            </div>
          </motion.div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* User Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-6 py-8 ${
                isDarkMode ? "bg-gray-900" : "bg-white"
              }`}
            >
              <div className="flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative cursor-pointer"
                  onClick={() => setIsAvatarPreviewOpen(true)}
                >
                  <Image
                    src={avatar || "https://picsum.photos/200/300?random=10"}
                    alt={username}
                    width={120}
                    height={120}
                    className={`rounded-full object-cover ring-4 ring-offset-2 ${
                      isDarkMode
                        ? "ring-gray-700 ring-offset-gray-900"
                        : "ring-gray-200 ring-offset-white"
                    }`}
                  />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-4 text-xl font-semibold ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {username}
                </motion.h3>
                {email && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {email}
                  </motion.p>
                )}
                {phone && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {phone}
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Shared Media */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-6 py-6 ${
                isDarkMode ? "bg-gray-900" : "bg-white"
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}>
                Shared Media
              </h3>
              {sharedMedia.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {sharedMedia.map((mediaUrl, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => handleMediaClick(mediaUrl)}
                    >
                      <Image
                        src={mediaUrl}
                        alt="Shared media"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                        <IoImageOutline className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-6 h-6" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center py-8 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  No shared media yet
                </motion.p>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <FullscreenMediaPreview
        isOpen={isAvatarPreviewOpen}
        fileUrl={avatar || ""}
        fileType="image"
        onClose={() => setIsAvatarPreviewOpen(false)}
        avatarPreview={true}
        controls={false}
      />

      {selectedMedia && (
        <FullscreenMediaPreview
          isOpen={!!selectedMedia}
          fileUrl={selectedMedia}
          fileType="image"
          onClose={() => setSelectedMedia(null)}
          avatarPreview={false}
        />
      )}
    </>
  );
}

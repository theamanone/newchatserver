import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isDarkMode: boolean;
  width?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  height?: "auto" | "full";
  showCloseButton?: boolean;
}

const modalWidths = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-[90vw]",
};

const modalHeights = {
  auto: "max-h-[90vh]",
  full: "h-[90vh]",
};

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  isDarkMode,
  width = "md",
  height = "auto",
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [visible]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
            isDarkMode ? "bg-gray-900/95" : "bg-gray-100/55"
          }`}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${modalWidths[width]} ${modalHeights[height]} 
              ${isDarkMode ? "bg-gray-800" : "bg-white"} 
              rounded-xl shadow-xl overflow-hidden`}
          >
            {showCloseButton && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`absolute top-4 right-4 p-2 rounded-full z-50 ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <IoClose className="w-5 h-5" />
              </motion.button>
            )}

            <div className="h-full overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { useAppContext } from "@/context/useContext";

type ConfirmProps = {
  isOpen: boolean;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
  message: string;
  showInput?: boolean;
  inputPlaceholder?: string;
};

const Confirm: React.FC<ConfirmProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  message,
  showInput = false,
  inputPlaceholder = "Type 'DELETE' to confirm",
}) => {
  const [inputValue, setInputValue] = useState("");
  const { isDarkMode } = useAppContext()
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      document.body.style.overflow = ""; // Reset scrolling
    }

    // Cleanup on unmount or isOpen change
    return () => {
      document.body.style.overflow = ""; // Ensure scrolling is restored
    };
  }, [isOpen]);

  const handleConfirm = () => {
    if (showInput && inputValue.toLocaleLowerCase() !== "delete") {
      alert("Please type 'DELETE' to confirm.");
      return;
    }
    onConfirm(inputValue); // Pass the input value when confirming
  };

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onCancel}>
      <AnimatePresence>
        {isOpen && (
          <>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 top-0 left-0 h-full w-full bg-black/50 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed inset-0 flex justify-center items-center z-50 p-4"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ 
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1]  // Custom ease curve
                }}
              >
                <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-xl w-full max-w-md overflow-hidden`}>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full ${isDarkMode ? 'bg-red-900/20' : 'bg-red-100'} flex items-center justify-center`}>
                        <HiOutlineExclamationTriangle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                      </div>
                      <Dialog.Title className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Confirm Action
                      </Dialog.Title>
                    </div>
                    
                    <Dialog.Description className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-base mb-6`}>
                      {message}
                    </Dialog.Description>

                    {showInput && (
                      <div className="mb-6">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          className={`w-full p-3 border ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                          } rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all`}
                          placeholder={inputPlaceholder}
                        />
                      </div>
                    )}

                    <div className="flex gap-3 justify-end">
                      <button
                        className={`px-4 py-2.5 rounded-lg ${
                          isDarkMode 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        } transition-colors duration-200`}
                        onClick={onCancel}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
                        onClick={handleConfirm}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default Confirm;

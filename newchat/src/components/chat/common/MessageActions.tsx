// MessageActions.tsx
import { useAppContext } from "@/context/useContext";
import React, { useState } from "react";
import {
  FaReply,
  FaShare,
  FaInfoCircle,
  FaTrash,
  FaCheckCircle,
} from "react-icons/fa";
import { FaClipboard } from "react-icons/fa6";
import { LuLoader2 } from "react-icons/lu";

interface MessageActionsProps {
  showInfo: boolean;
  setShowInfo: (show: boolean) => void;
  setShowConfirmDialog: (show: boolean) => void;
  setShowForWardMessage: (show: boolean) => void;
  message: {
    isYour: boolean;
    content: string;
    timestamp: string; // or Date depending on your type
  };
  isWithinDeleteWindow: (timestamp: string) => boolean;
  setDeleteForEveryone: (value: boolean) => void;
  onReply: () => void;
  onClose: () => void;
  copy: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  setShowInfo,
  setShowConfirmDialog,
  message,
  isWithinDeleteWindow,
  setDeleteForEveryone,
  onReply,
  onClose,
  copy,
}) => {
  const [isCopying, setIsCopying] = useState(false);
  const [copyStatus, setCopyStatus] = useState<
    "uncopied" | "copying" | "copied"
  >("uncopied");

  const { isDarkMode } = useAppContext();

  const handleCopy = async () => {
    setIsCopying(true);
    setCopyStatus("copying");

    // Simulate the copy action (you might want to copy the message content here)
    await navigator.clipboard.writeText(message?.content); // Assuming message.content has the text you want to copy

    setCopyStatus("copied");

    // Reset state after 1 second
    setTimeout(() => {
      setIsCopying(false);
      setCopyStatus("uncopied");
    }, 500);
  };

  return (
    <div className={`${isDarkMode ? "" : ""} w-full`}>
      {/* Reply button */}
      <button
        className={`mb-1 w-full text-left px-2 rounded-md py-2  ${
          isDarkMode
            ? "bg-dark-quaternary-color hover:bg-dark-quaternary-hover-color"
            : "bg-light-quaternary-hover-color text-gray-100 hover:bg-light-quaternary-focus-color"
        }  flex items-center`}
        onClick={() => {
          onReply();
          onClose();
        }}
      >
        <FaReply className="mr-2" /> Reply
      </button>

      {/* Forward button */}
      <button
        className={`mb-1 w-full text-left px-2 rounded-md py-2  ${
          isDarkMode
            ? "bg-dark-quaternary-color hover:bg-dark-quaternary-hover-color"
            : "bg-light-quaternary-hover-color text-gray-100 hover:bg-light-quaternary-focus-color"
        }  flex items-center`}
        onClick={() => {
          setShowConfirmDialog(true);
          onClose();
        }}
      >
        <FaShare className="mr-2" /> Forward
      </button>

      {/* Info button */}
      <button
        className={`mb-1 w-full text-left px-2 rounded-md py-2  ${
          isDarkMode
            ? "bg-dark-quaternary-color hover:bg-dark-quaternary-hover-color"
            : "bg-light-quaternary-hover-color text-gray-100 hover:bg-light-quaternary-focus-color"
        }  flex items-center`}
        onClick={() => {
          setShowInfo(true);
        }}
      >
        <FaInfoCircle className="mr-2" /> Info
      </button>

      {/* Delete button */}
      <button
        className={`${copy && "mb-1"} w-full text-left px-2 rounded-md py-2  ${
          isDarkMode
            ? "bg-dark-quaternary-color hover:bg-dark-quaternary-hover-color"
            : "bg-light-quaternary-hover-color text-gray-100 hover:bg-light-quaternary-focus-color"
        }  flex items-center`}
        onClick={() => {
          setShowConfirmDialog(true);
          onClose();
        }}
      >
        <FaTrash className="mr-2" /> Delete For Me
      </button>

      {/* Show "Delete for Everyone" only if the message is within the delete window */}
      {message.isYour && isWithinDeleteWindow(message.timestamp) && (
        <button
          className={`${copy && "mb-1"} w-full text-left px-2 rounded-md py-2  ${
            isDarkMode
              ? "bg-dark-quaternary-color hover:bg-dark-quaternary-hover-color"
              : "bg-light-quaternary-hover-color text-gray-100 hover:bg-light-quaternary-focus-color"
          }  flex items-center`}
          onClick={() => {
            setShowConfirmDialog(true);
            setDeleteForEveryone(true);
            onClose();
          }}
        >
          <FaTrash className="mr-2" /> Delete For Everyone
        </button>
      )}

      {/* Copy button */}
      {copy && (
        <button
          className={`${isWithinDeleteWindow(message.timestamp) && "mb-1"} w-full text-left px-2 rounded-md py-2  ${
            isDarkMode
              ? "bg-dark-quaternary-color hover:bg-dark-quaternary-hover-color"
              : "bg-light-quaternary-hover-color text-gray-100 hover:bg-light-quaternary-focus-color"
          }  flex items-center`}
          onClick={handleCopy}
          disabled={isCopying} // Disable while copying
        >
          {isCopying ? (
            <>
              <LuLoader2 className="mr-2 animate-spin" /> Copying...
            </>
          ) : (
            <>
              {copyStatus === "copied" ? (
                <>
                  <FaCheckCircle className="mr-2 text-green-400" /> Copied!
                </>
              ) : (
                <>
                  <FaClipboard className="mr-2" /> Copy
                </>
              )}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default MessageActions;

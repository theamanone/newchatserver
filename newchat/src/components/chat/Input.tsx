"use client";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import ImageCompressor from "browser-image-compression"; 
import {
  FaTimes,
  FaFileAlt,
  FaImages,
  FaArrowUp,
  FaVideo,
} from "react-icons/fa";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { LuSmilePlus } from "react-icons/lu";
import useOutsideClick from "@/utils/documentOutSideClick";
import { useAppContext } from "@/context/useContext";
import { useSocket } from "@/context/SocketContext";
type InputProps = {
  onSendMessage: (content: any) => void;
  handleCancelReply: () => void;
  messageReply?: any;
  disabled?: boolean;
};

const Input: React.FC<InputProps> = ({
  onSendMessage,
  handleCancelReply,
  messageReply,
  disabled = false,
}) => {
  const [message, setMessage] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]); // Support multiple files (up to 10)
  const textareaRef = useRef<HTMLTextAreaElement>(null); // To auto-resize textarea
  const [emojiShow, setEmojiShow] = useState(false);
  const [charError, setCharError] = useState<string>("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
/* The above code is a comment block in a TypeScript React file. It appears to be referencing some
functions or variables related to socket communication. The commented out code seems to be
attempting to destructure an object returned by a `useSocket` hook, extracting `typingStart`,
`typingStop`, and `typingUsers` from it. However, the code is not valid as it is commented out with
`//` and ` */

  // const { typingStart, typingStop, typingUsers } = useSocket();

  const { isMobile, isDarkMode } = useAppContext();

  const theme: Theme = isDarkMode ? Theme.DARK : Theme.LIGHT;
  const emojiStyle: EmojiStyle = EmojiStyle.APPLE;

  const emojiDivRef = useRef<HTMLDivElement | null>(null);
  useOutsideClick(emojiDivRef, () => setEmojiShow(false));

  const maxChars = 4096;


  const MAX_FILE_COUNT = 1; // Default limit for the number of files
  const MAX_FILE_SIZE_MB = 20; 


  // const   handleTyping = () => {
  //   typingStart(); // Notify that the user started typing

  //   // Clear any existing typing timeout
  //   if (typingTimeoutRef.current) {
  //     clearTimeout(typingTimeoutRef.current);
  //   }

  //   // Set a new timeout to stop typing after 1 second of inactivity
  //   typingTimeoutRef.current = setTimeout(() => {
  //     typingStop(); // Notify that the user has stopped typing
  //   }, 1000);
  // };


  // Input.tsx
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.length > maxChars) {
      setCharError(`Character limit exceeded! Max allowed: ${maxChars}`);
      return;
    }
    if (message.trim() || files.length > 0) {
      // Prepare the messages array
      const messagesToSend: {
        message: string;
        type: "text" | "image" | "video" | "file" | "link";
        files?: File[];
        isYour?: Boolean;
        mediaUrl?: string;
      }[] = [];
      const urlPattern =
        /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})/g; // Modified regex to include domain names without protocol
      const urlsInMessage = message.match(urlPattern);

      // Check if the message is only a URL
      const isOnlyLink =
        urlsInMessage &&
        urlsInMessage.length === 1 &&
        message.trim() === urlsInMessage[0];

      if (files.length > 0) {
        files.forEach((file) => {
          const messageType: "image" | "video" | "file" = file.type.startsWith(
            "image/"
          )
            ? "image"
            : file.type.startsWith("video/")
              ? "video"
              : "file";

          messagesToSend.push({
            message: "",
            type: messageType,
            mediaUrl: URL.createObjectURL(file),
            files: [file], // Send as individual file
            isYour: true,
          });
        });
      }

      // Add the text message as the last message
      if (message.trim()) {
        if (isOnlyLink) {
          // If the message is only a link
          messagesToSend.push({
            message: message.trim(),
            type: "link", // Set the message type as link
            isYour: true,
          });
        } else {
          // console.log("type text")
          // Otherwise, send it as a text message
          messagesToSend.push({
            message: message.trim(),
            type: "text",
            isYour: true,
          });
        }
      }

      // Send all messages
      messagesToSend.forEach((content: any) => onSendMessage(content));

      setMessage("");
      setFiles([]); // Reset files after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // If Shift + Enter is pressed, insert a new line
        return;
      } else {
        // Prevent default behavior (adding new line)
        if (!isMobile) {
          e.preventDefault();
          handleSend(e); // Send the message
        }
      }
    }
  };


  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    maxFileCount = MAX_FILE_COUNT,
    maxFileSizeMB = MAX_FILE_SIZE_MB
  ) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).slice(0, maxFileCount); // Limit the number of files
  
      // Validate file size
      for (const file of newFiles) {
        if (file.size > maxFileSizeMB * 1024 * 1024) {
          alert(`File size exceeds ${maxFileSizeMB}MB limit. Please choose a smaller file.`);
          return;
        }
      }
  
      setFiles((prevFiles) => {
        if (prevFiles.length >= maxFileCount) {
          alert(`You can only upload up to ${maxFileCount} file(s).`);
          return prevFiles; // Do not add more files
        }
        const combinedFiles = [...prevFiles, ...newFiles];
        return combinedFiles.slice(0, maxFileCount); // Ensure the total number of files does not exceed the limit
      });
    }
  };
  
  const handleFilePaste = (
    e: ClipboardEvent,
    maxFileCount = MAX_FILE_COUNT
  ) => {
    e.preventDefault(); // Prevent default paste behavior
  
    const pastedFiles = Array.from(e.clipboardData?.files || []);
  
    // Check if files already exist or exceed the limit
    setFiles((prevFiles) => {
      if (prevFiles.length >= maxFileCount) {
        alert(`You can only paste up to ${maxFileCount} file(s).`);
        return prevFiles; // Do not allow more files to be pasted
      }
  
      if (pastedFiles.length > maxFileCount) {
        alert(`You can only paste up to ${maxFileCount} file(s).`);
        return prevFiles;
      }
  
      return [...prevFiles, ...pastedFiles].slice(0, maxFileCount); // Ensure the total number of files does not exceed the limit
    });
  };


  useEffect(() => {
    // console.log(replyMessage);
    const handlePaste = (e: ClipboardEvent) => {
      handleFilePaste(e);
    };
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  const handleRemoveFile = (fileIndex: number) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== fileIndex)
    );
  };

  const isImageFile = (file: File): boolean => file.type.startsWith("image/");

  // Function to auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const isVideoFile = (file: File) => {
    return file.type.startsWith("video/");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    if (input.length > maxChars) {
      setCharError(`Character limit exceeded! Max allowed: ${maxChars}`);
    } else {
      setCharError(""); // Clear error if within limit
    }
    setMessage(input); // Update message state
    // handleTyping(); // Start typing indicator
  };

  const handleTextAreaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      message.length >= maxChars &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault(); // Block additional input except for the allowed keys
      setCharError(`Character limit exceeded! Max allowed: ${maxChars}`);
    }
  };

  return (
    <footer className={`p-4 relative ${isMobile && "sticky bottom-0 !p-2"}`}>
      <form
        className={`flex  flex-col mt-1 min-h-14 ${isDarkMode ? "bg-dark-primary-color" : "bg-light-quaternary-color"
          } backdrop-blur-sm rounded-2xl ${isMobile && "min-h-12"} `}
        onSubmit={handleSend}
      >
        {messageReply?.content && (
          <div className="  rounded-2xl rounded-bl-none rounded-br-none flex justify-between items-center p-1  relative">
            <div
              className={`flex flex-col w-full border-l-4 border-white  ${isDarkMode
                  ? "bg-dark-quaternary-color"
                  : "bg-light-quaternary-hover-color"
                } rounded-xl pl-2 p-1`}
            >
              <span className=" font-bold text-sm">
                {messageReply?.sender?.username || ""}
              </span>
              <span className="  italic text-xs truncate">
                {messageReply?.messageType === "text"
                  ? messageReply?.content.substring(0, 50) + "..."
                  : messageReply?.messageType}
              </span>
            </div>
            <button
              onClick={handleCancelReply}
              className=" hover:text-gray-800 ml-1"
              aria-label="Cancel reply"
            >
              <FaTimes size={16} className="p-2 box-content" />
            </button>
          </div>
        )}

        {files.length > 0 && (
          <div className="rounded-lg pt-2 pl-2 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className={`relative  ${isDarkMode
                    ? "bg-dark-quaternary-color"
                    : "bg-light-quaternary-hover-color"
                  } rounded-md flex flex-col items-center p-1`}
              >
                {/* Image File Preview */}
                {isImageFile(file) ? (
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    width={64}
                    height={64}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                ) : isVideoFile(file) ? (
                  /* Video File Preview */
                  <div className="relative w-12 h-12">
                    <video
                      src={URL.createObjectURL(file)}
                      className="w-12 h-12 object-cover rounded-md"
                      webkit-playsinline
                      playsInline
                    />
                    {/* Overlay a play icon on the video for visual indication */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                      <FaVideo size={16} />
                    </div>
                  </div>
                ) : (
                  /* Other File Types (Documents, PDFs) */
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md">
                    <FaFileAlt size={24} />
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="absolute top-1 right-1  "
                  aria-label="Remove file"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <section className="flex items-center relative">
          {emojiShow && (
            <div ref={emojiDivRef} className="absolute  bottom-[70px] left-1">
              <EmojiPicker
                style={{ backgroundColor: isDarkMode ? "#111827" : "#dcd8fd" }}
                autoFocusSearch={false}
                theme={theme}
                emojiStyle={emojiStyle}
                onEmojiClick={handleEmojiClick}
              />
            </div>
          )}
          <LuSmilePlus
            className={` text-3xl p-3 cursor-pointer rounded-xl  box-content ${isDarkMode ? "" : "text-gray-700"
              } ${isMobile && "rounded-full"}`}
            onClick={() => setEmojiShow(!emojiShow)}
          />

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown} // Add the keydown handler
            placeholder="Type a message or paste a file..."
            className={`flex-1 max-h-20   p-2 bg-transparent focus:outline-none resize-none overflow-hidden ${isMobile && "placeholder:text-sm  !items-center py-3"
              }`}
            rows={1} // Start with 1 row
            // maxLength={maxChars}
            onKeyDownCapture={handleTextAreaKeyDown}
          />
          {charError && (
            <p className="absolute bottom-0.5 left-2 text-red-500 text-xxs italic">
              {charError}
            </p>
          )}
          <input
            type="file"
            onChange={(e) => handleFileChange(e, 3, 10)}
            className="hidden"
            id="fileUpload"
            multiple // Allow multiple files
          />
          <label
            htmlFor="fileUpload"
            className={` ${isMobile ? "p-0" : "p-2"
              } flex items-center cursor-pointer`}
            aria-label="Upload files"
          >
            <FaImages
              className={`text-2xl cursor-pointer ${isDarkMode
                  ? "border-white"
                  : "bg-light-quaternary-color text-gray-700 border-gray-100"
                } border-2   rounded-xl p-2 box-content ${isMobile && "!rounded-full"
                }`}
            />
          </label>
          <button
            type="submit"
            disabled={!message.trim() && files.length === 0}
            className=" m-1 mr-2 rounded-lg transition duration-150 ease-in-out"
          >
            <FaArrowUp
              className={`text-2xl cursor-pointer  ${isDarkMode
                  ? "border-white"
                  : "bg-light-quaternary-color text-gray-700 border-gray-100"
                }  border-2  rounded-xl p-2 box-content ${isMobile && "!rounded-full"
                }`}
            />
          </button>
        </section>
      </form>
    </footer>
  );
};

export default Input;

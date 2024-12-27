import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FaFileAlt, FaEllipsisV, FaTrash, FaCheck, FaCheckDouble, FaEye } from "react-icons/fa"; // Import the more icon
import { DEFAULT_FALLBACK_MESSAGE_IMAGE } from "@/lib/data";
import { deleteMessage, getMetaData } from "@/utils/apihandler";
import useOutsideClick from "@/utils/documentOutSideClick";
import ConfirmationDialog from "../common/ConfirmationDialog";
import MessageInfo from "./common/MessageInfo";
import MessageActions from "./common/MessageActions";
import FullscreenMediaPreview from "./common/FullscreenMediaPreview";
import { useAppContext } from "@/context/useContext";
import { RiCheckDoubleFill, RiCheckFill } from "react-icons/ri";

// Define the type for the message prop
interface MessageType {
  _id: string;
  content: string;
  mediaUrl: string;
  messageType:
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "gif"
  | "link";
  fileType?: string; // Optional, as it may not be present for all message types
  receiver: any;
  sender: any; // Replace with the actual sender type as needed
  timestamp: string; // Use Date or string based on your data structure
  isYour: boolean;
  isLoading: boolean;
  uploadProgress: number;
  error: any;
  status: any;
}

// Helper function to detect if the string contains only emojis
const isOnlyEmojis = (text: string): boolean => {
  const emojiRegex =
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)+$/u;
  return emojiRegex.test(text);
};

// Helper function to count emojis in the message
const countEmojis = (text: string): number => {
  const emojiRegex =
    /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)/gu;
  const emojis = text.match(emojiRegex);
  return emojis ? emojis.length : 0;
};

interface MessageProps {
  message: MessageType;
  setMessages: any;
  setMessageReply: any;
  messageReply: any;
  markAsSeen:any
}

const Message: React.FC<MessageProps> = ({
  message,
  setMessages,
  setMessageReply,
  messageReply,
  markAsSeen
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [controlsTimeoutRef, setControlsTimeoutRef] =
    useState<NodeJS.Timeout | null>(null); // Use state for timeout
  const controlsRef = useRef<HTMLDivElement | null>(null); // Ref for controls div
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");

  const [metadata, setMetadata] = useState<{
    title: string;
    image: string | null;
  }>({
    title: "",
    image: null,
  });


  const isUploading = message.isLoading;
  const uploadProgress = message.uploadProgress || 0;
  const hasError = !!message.error;

  const { isMobile, isDarkMode } = useAppContext();

  useOutsideClick(controlsRef, () => setShowControls(false));
  useEffect(() => {
    // console.log("msg", message);
  }, [message]);

  // In-memory cache for storing fetched metadata
  const metadataCache: {
    [key: string]: { title: string; image: string | null };
  } = {};

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Safeguards and logic for marking as "seen"
            const senderId = message?.sender?._id;
            const receiverId = message?.receiver;
            const currentUserId = message?.isYour
              ? message?.sender?._id
              : message?.receiver;
  
            if (receiverId === currentUserId) {
              // Safeguard: Ensure `status` is an array before calling `.find`
              const existingStatus = Array.isArray(message?.status)
                ? message.status.find((s: any) => s.userId === currentUserId)
                : null;
  
              if (!existingStatus || existingStatus.status !== "seen") {
                // Mark the message as "seen"
                // markAsSeen(message._id, receiverId);
              }
            }
          }
        });
      },
      { threshold: 1.0 } // Trigger when the element is fully visible
    );
  
    if (controlsRef.current) {
      observer.observe(controlsRef.current);
    }
  
    return () => {
      if (controlsRef.current) {
        observer.unobserve(controlsRef.current);
      }
    };
  }, [message, markAsSeen]);
  
  
  
  useEffect(() => {
    const fetchMeta = async (url: string) => {
      // Check if metadata for the URL is already in cache
      if (metadataCache[url]) {
        setMetadata(metadataCache[url]); // Use cached metadata
      } else {
        // Fetch metadata if not in cache
        const response = await getMetaData(url);
        const fetchedTitle = response?.data?.title || ""; // Fallback to empty string
        const fetchedImage = response?.data?.image || null; // Fallback to null

        // Update the state with fetched title and image
        const newMetadata = {
          title: fetchedTitle,
          image: fetchedImage,
        };
        setMetadata(newMetadata);

        // Store the metadata in the cache for future use
        metadataCache[url] = newMetadata;
      }
    };
    if (message?.messageType === "link") {
      fetchMeta(message.content);
    }
  }, [message?.content, message?.messageType]);

  const handleDelete = async () => {
    try {
      await deleteMessage(message._id, deleteForEveryone);
      setMessages((prevMessages: any) =>
        prevMessages.filter((msg: any) => msg._id !== message._id)
      );
      if (messageReply?._id === message._id) {
        setMessageReply([{}]);
      }
    } catch (error: any) {
      console.error("Error deleting message:", error.message);
    }
  };
  const handleDeleteForEveryone = async () => {
    try {
      await deleteMessage(message._id, deleteForEveryone);
      setMessages((prevMessages: any) =>
        prevMessages.filter((msg: any) => msg._id !== message._id)
      );
    } catch (error: any) {
      console.error("Error deleting message:", error.message);
    }
  };
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (controlsTimeoutRef) clearTimeout(controlsTimeoutRef); // Clear any existing timeout
  };
  const handleMouseLeave = () => {
    // Set a timeout to hide controls after a delay
    const timeoutId = setTimeout(() => {
      if (!showControls) {
        setIsHovered(false); // Hide controls only if not interacting with them
      }
    }, 900); // Adjust the delay as needed
    setControlsTimeoutRef(timeoutId);
  };
  const handleControlMouseEnter = () => {
    if (controlsTimeoutRef) clearTimeout(controlsTimeoutRef); // Clear timeout when hovering over controls
    setShowControls(true); // Keep controls visible when hovering over them
  };
  const handleControlMouseLeave = () => {
    // Set a timeout to hide controls after a delay
    const timeoutId = setTimeout(() => {
      setShowControls(false); // Hide controls only when the user leaves
      setIsHovered(false);
    }, 500); // Adjust the delay as needed
    setControlsTimeoutRef(timeoutId);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderMedia = () => {
    switch (message.messageType) {
      case "text":
        const onlyEmojis = isOnlyEmojis(message.content);
        const emojiCount = countEmojis(message.content);

        if (onlyEmojis && emojiCount <= 10) {
          return (
            <div
              className={`px-2 my-1 flex justify-end ${emojiCount > 1 ? "text-4xl" : "text-6xl"
                }`}
            >
              <p>{message.content}</p>
            </div>
          );
        }

        return (
          <div
            className={`px-2 py-1 flex  w-full  ${isMobile && " mr-10 max-w-[75vw]"
              } ${onlyEmojis ? "justify-end" : ""} ${message.content.length < 50 ? "w-[70%] tracking-wide" : " w-auto"
              }`}
          >
            <p className="whitespace-pre-wrap ">{message.content}</p>
          </div>
        );

      case "image":
        return (
          <div
            className={`relative flex flex-col  justify-center items-center mx-auto w-full ${isMobile
                ? "!min-w-[75vw] !max-w-[75vw]"
                : "!min-w-[20vw] max-w-[20vw]"
              }`}
          >
            {/* <div className="sticky -top-4 rounded-full w-full p-0.5 backdrop-blur-sm bg-black/15"></div> */}
            <Image
              src={message?.mediaUrl || ""}
              alt="uploaded"
              width={1920}
              height={1080}
              loading="lazy"
              className={`rounded-md !w-full ${isMobile && "!w-full"} ${message.isYour ? "rounded-br-none" : "rounded-bl-none"
                } cursor-pointer w-auto max-w-full  max-h-[100vh] object-contain`}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_FALLBACK_MESSAGE_IMAGE;
                e.currentTarget.alt = "Image failed to load";
              }}
            />
            {isUploading && (
              <div className="absolute bottom-2 right-2">
                <div className="relative w-8 h-8">
                  <svg
                    className="absolute top-0 left-0 w-full h-full"
                    viewBox="0 0 36 36"
                  >
                    <path
                      className="text-gray-200"
                      d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="text-blue-600"
                      d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831"
                      fill="none"
                      strokeDasharray={`${uploadProgress}, 100`}
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <span className="text-xs text-white">
                      {uploadProgress}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            {hasError && (
              <div className="absolute bottom-2 right-2">
                <span className="text-red-600">
                  <FaTrash size={24} />
                </span>
              </div>
            )}
          </div>
        );

      case "video":
        return (
          <div
            className={`max-w-[20vw] mx-auto ${isMobile && "!min-w-[75vw] !max-w-[75vw]"
              }`}
          >
            <video
              muted
              className="w-full h-auto rounded-md cursor-pointer"
              onMouseEnter={(e) => e.currentTarget.play()} // Play video on hover
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }} // Pause video when hover stops
            >
              <source src={message?.mediaUrl} type={message.fileType} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case "audio":
        return (
          <div className="max-w-[70vw] mx-auto">
            <audio controls className="w-full">
              <source src={message?.mediaUrl} type={message.fileType} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );

      case "document":
        return (
          <div className="flex items-center max-w-[70vw] mx-auto">
            <FaFileAlt className="text-white mr-2" />
            <a
              href={message?.mediaUrl}
              className="text-white underline"
              download
            >
              Download Document
            </a>
          </div>
        );

      case "gif":
        return (
          <div className="max-w-[70vw] mx-auto">
            <Image
              src={message?.mediaUrl}
              alt="gif"
              className="w-full h-auto rounded-md object-contain"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_FALLBACK_MESSAGE_IMAGE;
                e.currentTarget.alt = "GIF failed to load";
              }}
            />
          </div>
        );

      case "link":
        if (metadata) {
          // console.log("metadata : ", metadata);
          return (
            <div
              className={`flex flex-col items-center max-w-[70vw] mx-auto my-0  rounded-lg overflow-hidden ${isMobile && "!min-w-[75vw] !max-w-[75vw]"
                }`}
            >
              <a
                href={message.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600  hover:underline  rounded transition duration-200 ease-in-out "
              >
                {metadata.image && (
                  <Image
                    src={metadata?.image || ""}
                    alt="Link Preview"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    width={400}
                    height={400}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_FALLBACK_MESSAGE_IMAGE; // Fallback image
                      e.currentTarget.alt = "Image failed to load";
                    }}
                  />
                )}
                <div className="p-2">
                  {metadata.title || message.content}{" "}
                  {/* Display the link or the title */}
                </div>
              </a>
            </div>
          );
        }

      default:
        return <p className="text-red-500">Unsupported media type.</p>;
    }
  };

  const handleOnConfirm = () => {
    setShowConfirmDialog(false);
    handleDeleteForEveryone();
    deleteForEveryone ? handleDelete() : handleDeleteForEveryone();
  };

  const isWithinDeleteWindow = (timestamp: string): boolean => {
    const messageTime = new Date(timestamp).getTime();
    const currentTime = new Date().getTime();

    // Time difference in minutes (10 minutes = 600,000 milliseconds)
    const timeDifference = currentTime - messageTime;
    const tenMinutesInMilliseconds = 10 * 60 * 1000;

    return timeDifference <= tenMinutesInMilliseconds;
  };

  const handleOpenPreview = (url: string, type: string) => {
    setFileUrl(url);
    setFileType(type);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setFileUrl("");
    setFileType("");
  };

  const handleReply = () => {
    // console.log(message);
    setMessageReply({
      _id: message._id,
      content: message.content,
      messageType: message.messageType,
      sender: message.sender,
      mediaUrl: message.mediaUrl,
      timestamp: message.timestamp,
      isYour: message.isYour,
    });
  };

  const [isRightClick, setIsRightClick] = useState(false);
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default browser right-click menu
    setIsRightClick(true); // Flag that a right-click occurred
    setShowInfo(false);
    setShowControls(true); // Show custom controls
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.button === 0 && !isRightClick) {
      // Only proceed if it's a left-click and no right-click happened
      e.stopPropagation();
      if (message.messageType !== "text" && message.messageType !== "link") {
        handleOpenPreview(message.mediaUrl, message.messageType);
      }
    }
    setIsRightClick(false); // Reset right-click flag after any click
  };


  const renderMessageStatus = () => {
    switch (message?.status?.[0]?.status) {
      case 'sent':
        return <RiCheckFill className="text-sm ml-2 text-gray-400" />;  // Single check for 'sent'
      case 'delivered':
        return <RiCheckDoubleFill className="text-lg ml-2 text-gray-400" />;  // Double check for 'delivered'
      case 'seen':
        return <RiCheckDoubleFill className="text-lg ml-2 text-blue-500" />; 
      default:
        return null;
    }
  };


  return (
    <>
      <style jsx>{`
        .hide_scroll_bar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {showConfirmDialog && (
        <ConfirmationDialog
          message={
            !deleteForEveryone
              ? "Are you sure you want to delete the message "
              : "Are you sure you want to delete the message for everyone"
          }
          onConfirm={handleOnConfirm}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
      <FullscreenMediaPreview
        isOpen={isPreviewOpen}
        fileUrl={fileUrl}
        fileType={fileType}
        onClose={handleClosePreview}
      />
      <div
        onDoubleClick={handleReply}
        ref={controlsRef}
        className={`w-auto relative flex items-center h-auto ${message.isYour ? "ml-auto " : ""
          }`}
      >
        {message.isYour && isHovered && !isMobile && (
          <FaEllipsisV
            size={18}
            className="mx-1 box-content py-4 rounded-lg cursor-pointer hover:text-gray-400"
            onClick={() => setShowControls(!showControls)}
          />
        )}
        <div
          className={`relative rounded-lg flex   w-auto max-w-sm mb-2 ${message.isYour
              ? `${isDarkMode
                ? "bg-gray-900"
                : "bg-light-secondary-dark-color text-black"
              }   rounded-br-none`
              : `${isDarkMode ? "bg-gray-700" : "bg-light-secondary-color"
              }  rounded-bl-none`
            } ${isOnlyEmojis(message.content) && countEmojis(message.content) <= 10
              ? "!bg-transparent"
              : "shadow-md"
            }`}
        >
          <div
            onClick={handleClick} // Handle left-click
            onContextMenu={handleContextMenu} // Handle right-click
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative w-auto flex flex-col  hide_scroll_bar ${isMobile ? "max-w-[75vw]" : "!max-w-[40vw]"
              }`}
          >
            {renderMedia()} {/* Call the function to render media */}
            {message.messageType === "text" &&
              !isOnlyEmojis(message.content) && (
                <span className=" text-xxs  px-2 pb-0.5 italic inline-flex justify-end w-auto text-right">
                  {formatDate(message?.timestamp)}
                  {message?.isYour && (renderMessageStatus())}
                </span>
              )}
            {/* More icon outside the message */}
            <div
              className={`absolute ${message.isYour ? "-left-14" : "right-2"
                } top-[50%] z-10`}
              onMouseEnter={handleControlMouseEnter}
              onMouseLeave={handleControlMouseLeave}
            >
              {showControls && (
                <div
                  className={`absolute mt-[50%] w-40 flex flex-col text-start items-center text-sm p-1  border  ${isDarkMode ? "bg-dark-quaternary-color" : "bg-light-quaternary-color border-gray-100"} rounded-lg shadow-lg ${message.isYour
                      ? isWithinDeleteWindow(message.timestamp)
                        ? "-left-32"
                        : "-left-32"
                      : "-right-48"
                    } ${isMobile && (message?.isYour ? "left-14" : "right-0")}`}
                >
                  {showInfo ? (
                    <MessageInfo
                      showInfo={showInfo}
                      isYour={message.isYour}
                      setShowInfo={setShowInfo}
                      timeUpdated={formatDate(message?.timestamp)}
                    />
                  ) : (
                    <MessageActions
                      showInfo={showInfo}
                      onReply={handleReply}
                      setShowInfo={setShowInfo}
                      setShowConfirmDialog={setShowConfirmDialog}
                      setShowForWardMessage={() => { }}
                      message={message}
                      isWithinDeleteWindow={isWithinDeleteWindow}
                      setDeleteForEveryone={setDeleteForEveryone}
                      onClose={() => setShowControls(false)}
                      copy={
                        message.messageType === "text" ||
                        message.messageType === "link"
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {!message.isYour && isHovered && !isMobile && (
          <FaEllipsisV
            className=" mx-1 cursor-pointer py-4 rounded-lg box-content hover:text-gray-400"
            onClick={() => setShowControls(!showControls)}
          />
        )}
      </div>
    </>
  );
};

export default Message;

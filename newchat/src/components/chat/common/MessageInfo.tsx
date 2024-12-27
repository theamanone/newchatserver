// MessageInfo.tsx
import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import { MdKeyboardBackspace } from "react-icons/md";
import { PiIdentificationCard } from "react-icons/pi";

interface MessageInfoProps {
  showInfo: boolean;
  setShowInfo: (show: boolean) => void;
  isYour: boolean;
  timeUpdated: string; // You can modify this based on your actual time format
}

const MessageInfo: React.FC<MessageInfoProps> = ({
  showInfo,
  setShowInfo,
  isYour,
  timeUpdated,
}) => {
  if (!showInfo) return null; // Don't render anything if showInfo is false

  return (
    <div className="w-full h-full flex flex-col items-start p-2 bg-gray-800 rounded-lg shadow-md">
      {/* Back Button */}
      <span
        className="flex w-full items-center justify-start bg-gray-900 rounded-md cursor-pointer hover:bg-gray-700 transition-colors duration-200 p-1"
        onClick={() => setShowInfo(false)}
      >
        <MdKeyboardBackspace className=" px-1 text-sm box-content text-white" />
        <span className="text-white text-sm font-medium">Back</span>
      </span>

      {/* Identification Card Icon */}
      <div className="mt-2 flex items-center">
        <FaInfoCircle className="text-gray-300 text-sm mr-1" />
        <span className="text-white text-xs font-medium">Message Info</span>
      </div>

      {/* Time Update Section */}
      <div className="mt-2 flex  bg-gray-900/10 rounded-md p-2 shadow-inner w-full">
        <span className="text-gray-400 text-xs">
          {isYour ? "Sent" : "Received"} at:
        </span>
        <span className="text-white text-xs">{timeUpdated}</span>
      </div>

      {/* Additional Information (if needed) */}
      {/* <div className="mt-2">
        <span className="text-gray-400 text-sm">Additional details or info can go here.</span>
      </div> */}
    </div>
  );
};

export default MessageInfo;

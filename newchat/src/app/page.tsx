"use client";
import { useState, useEffect } from "react";
import ChatDialogue from "@/components/chat/ChatDialogue";
import { detectScreenshot } from "@/lib/screenshotDetection"; // Import the detection function
import { useAppContext } from "@/context/useContext";

export default function ChatComponent() {
  const { setLoading, loading, currentActivePageHandle } = useAppContext();
  const [isScreenBlocked, setIsScreenBlocked] = useState(false);

  // Callback function to block the screen when screenshot is detected
  const handleScreenshotDetected = () => {
    setIsScreenBlocked(true);
  };

  useEffect(() => {
    // Use the utility function to detect screenshot attempts
    detectScreenshot(handleScreenshotDetected);

    // Restore screen after user interacts again (optional)
    document.addEventListener("click", () => {
      setIsScreenBlocked(false);
    });

    currentActivePageHandle('home')
    
  }, []);

 


  return (
    <div
      className={`$ w-full h-full `}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Conditionally render black screen if screenshot is detected */}
      {/* {isScreenBlocked && (
        <div className="absolute top-0 left-0 w-full h-full bg-black z-20 flex items-center justify-center">
          <p className="text-white">window diactivated </p>
        </div>
      )} */}
      <ChatDialogue />
    </div>
  );
}

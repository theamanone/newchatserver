"use client"; // Marking this component as a Client Component

import { usePathname } from "next/navigation";
import LeftPanel from "@/components/panels/LeftPanel";
import { useAppContext } from "@/context/useContext";

const LeftPanelWrapper:any = () => {
  const { isMobile, currentActivePageState } = useAppContext();
  const pathname = usePathname(); // Get the current pathname

  // Determine if the LeftPanel should be shown
  const showLeftPanel = pathname === "/" || pathname.startsWith("/direct");

  // console.log("isMobile : ", isMobile)
  // console.log("currentActivePageState : ", currentActivePageState)

  // Logic to show LeftPanel based on isMobile and currentActivePageState
  const shouldShowPanel = () => {
    if (isMobile) {
      // On mobile, show if showLeftPanel is true and currentActivePageState is "home"
      return showLeftPanel && currentActivePageState === "home";
    }
    // On desktop, always show if showLeftPanel condition is true
    return showLeftPanel;
  };

  return <>{shouldShowPanel() && <LeftPanel />}</>;
};

export default LeftPanelWrapper;

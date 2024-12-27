// Detect screenshot or screen recording attempts
export const detectScreenshot = (onScreenshotDetected: () => void) => {
    // Visibility change (user switches tabs, tries screenshot)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        onScreenshotDetected();
      }
    });
  
    // Windows key + PrintScreen or PrintScreen button detection (desktop)
    document.addEventListener("keydown", (e) => {
      if (e.key === "PrintScreen" || (e.key === "S" && e.ctrlKey) || (e.key === "S" && e.metaKey)) {
        onScreenshotDetected();
      }
      // Common macOS screenshot shortcut (Cmd + Shift + 4 or 5)
      if (e.metaKey && e.shiftKey && (e.key === "4" || e.key === "5")) {
        onScreenshotDetected();
      }
    });
  
    // Detect mobile screen recording or screenshots (e.g., using power button)
    window.addEventListener("blur", () => {
      onScreenshotDetected();
    });
  
    // Prevent right-click context menu (optional for extra security)
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  };
  
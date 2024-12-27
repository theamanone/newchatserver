import bowser from "bowser";


  
  export const getDeviceInfo = () => {
    const browser = bowser.getParser(window.navigator.userAgent);
    const deviceInfo: any = browser.getResult();
    // console.log("Device info:", deviceInfo);
  
    return {
      device: deviceInfo.platform?.type || "Unknown",  // 'platform.type' for device type (e.g., 'mobile')
      os: deviceInfo.os?.name || "Unknown",            // 'os.name' for OS name (e.g., 'iOS')
      osVersion: deviceInfo.os?.version || "Unknown",  // 'os.version' for OS version
      deviceModel: deviceInfo.platform?.model || "Unknown",  // 'platform.model' for device model (e.g., 'iPhone')
    };
  };
  
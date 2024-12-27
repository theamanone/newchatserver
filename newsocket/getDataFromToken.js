const jwt = require("jsonwebtoken");

const getDataFromToken = (token) => {
  try {
    // Check for token in cookies or in Authorization header
   
    if (!token) {
      throw new Error("Token not found");
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded || !decoded.id) {
      console.error("Invalid token or missing user ID in token");
      return { error: "Invalid token", status: 401 };
    }
    console.log("decoded data : ", decoded)

    return { userId: decoded.id, deviceId: decoded.deviceId };
  } catch (error) {
    console.warn("Token verification failed or token not found:", error.message);
    return null; // Handle error gracefully
  }
};

module.exports = getDataFromToken;

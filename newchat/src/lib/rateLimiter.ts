const rateLimitMap = new Map<string, number[]>();

// Rate limit configuration
// Maximum number of requests
const MAX_REQUESTS = 100;
// 15 minutes time window
const TIME_WINDOW_MS = 15 * 60 * 1000;

export const rateLimiter = (ip: string): boolean => {
  const currentTime = Date.now();

  // Get the timestamps of previous requests from this IP
  let requestTimes = rateLimitMap.get(ip) || [];

  // Filter out timestamps older than the TIME_WINDOW_MS
  requestTimes = requestTimes.filter(
    (timestamp) => currentTime - timestamp < TIME_WINDOW_MS
  );

  if (requestTimes.length >= MAX_REQUESTS) {
    // Too many requests
    return false;
  }

  // Add the current request time
  requestTimes.push(currentTime);
  rateLimitMap.set(ip, requestTimes);

  // Allow request
  return true;
};

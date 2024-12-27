import axios from "axios";
import { refresh_token } from "./apihandler";

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom: any) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: process.env.SERVER_BASE_URL,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("auth_t") || ""; // Get token from sessionStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Set token directly on the config headers
    }

    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else if (typeof config.data === "object") {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    // Check if the response has the custom header for token expiration
    // console.log(" global response : ", response)
    const { expSoon } = response?.data

    if (expSoon) {
      // Handle the soon-to-expire token case
      // console.log("Token is about to expire, refreshing...");
      // Refresh the token here
      handleTokenRefresh(response);
    }
    return response; // If no action is needed, just return the response
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the request failed due to an expired token (401 or similar)
    // console.log(" errror token exp : ", error?.response.status , " orignal resuqest retry : " , !originalRequest._retry, " is Refreshing ", isRefreshing)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(async (resolve, reject) => {
        try {
          // const { accessToken } = await refresh_token();
          // sessionStorage.setItem("auth_t", accessToken);
          // axiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`;
          // originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          // processQueue(null, accessToken);
          // resolve(axiosInstance(originalRequest));
          // window.location.reload(); // Optional: Reload the window if necessary
        } catch (refreshError: any) {
          // console.log("Refresh error details:", refreshError.response?.data);
          if (
            refreshError.response?.data?.error ===
            "Invalid or expired refresh token"
          ) {
            // await axios.post("/api/v1/user/logout");
            // sessionStorage.removeItem("auth_t");
            // if (window.location.pathname !== "/auth/signin") {
            //   window.location.href = "/auth/signin";
            // }
          }
          processQueue(refreshError, null);
          reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      });
    }

    return Promise.reject(error);
  }
);

// Function to handle token refresh when the token is about to expire
async function handleTokenRefresh(response: any) {
  try {
    const { accessToken } = await refresh_token();
    // console.log("acess token ?: ", accessToken)
    sessionStorage.setItem("auth_t", accessToken);
    axiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`;
    return axiosInstance(response.config); // Resend the original request with the new token
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error; // Rethrow the error after handling
  }
}

export default axiosInstance;

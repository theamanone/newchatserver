"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
// import { useAppContext } from "@/context/useContext";
import { decrypt } from "@/utils/encryption";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    emailOrUsername: "i",
    password: "Aman123",
  });
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    emailOrUsername?: string;
    password?: string;
    api?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState("");
// const {setAccount, setIsLoggedIn} = useAppContext();

  const validateEmailOrUsername = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    return emailRegex.test(value) || usernameRegex.test(value);
  };

  const validatePassword = (value: string) => {
    return value.length >= 6; // Example password length validation
  };

  // useEffect(() => {
  //   async function fetchCsrfToken() { 
  //     const token = sessionStorage.getItem("auth_t");
  //     const response = await fetch("/api/user/csrf-t", {
  //       headers: { 
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     const data = await response.json();
  //     setToken(data.t);
  //   }
  //   fetchCsrfToken();
  // }, []);

  const onLogin = async () => {
    const emailOrUsernameError = !validateEmailOrUsername(user.emailOrUsername)
      ? "Invalid email or username format."
      : undefined;

    const passwordError =
      user.password.length > 0 && !validatePassword(user.password)
        ? "Password must be at least 6 characters long."
        : undefined;

    if (emailOrUsernameError || passwordError) {
      setErrors({
        emailOrUsername: emailOrUsernameError,
        password: passwordError,
      });
      return;
    }

    try {
      setLoading(true);
      const authToken = sessionStorage.getItem("auth_t");
      const headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": token, // Pass the CSRF token here
        "Authorization": `Bearer ${authToken}`,
      };
      const response: any = await axios.post("/api/v1/user/login", user, {
        headers,
        withCredentials: true,
      }); 

      const dynamicKey = Object.keys(response?.data)[1]; 
      const encryptedUserData = response?.data[dynamicKey];
  
  
      const decryptedData = decrypt(encryptedUserData, process.env.NEXT_PUBLIC_AES_KEY!);
  
      if (decryptedData) {
          // setAccount(decryptedData); 
          sessionStorage.setItem("account", JSON.stringify(decryptedData)); 
      }
  
  
      if (response?.data?.accessToken) {
        // Set the access token in localStorage
        localStorage.setItem("accessToken", response.data.accessToken);
        sessionStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        // setIsLoggedIn(true)
        // Redirect to the home page after successful login
        router.push("/"); // No need for window.location.reload()
      } else {
        setErrors({
          api:
            response.data.message ||
            "Error logging in. Please try again later.",
        });
      }
    } catch (error: any) {
      console.log(
        "Login failed",
        error.response?.data?.message || error.message
      );
      setErrors({
        api: error.response?.data?.message || "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isValid = user.emailOrUsername.length > 0 && user.password.length > 0;
    setButtonDisabled(!isValid);
  }, [user]);

  const handleEmailOrUsernameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setUser({ ...user, emailOrUsername: value });
    if (!validateEmailOrUsername(value)) {
      setErrors((prev) => ({
        ...prev,
        emailOrUsername: "Invalid email or username format.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, emailOrUsername: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUser({ ...user, password: value });
    if (value.length > 0 && !validatePassword(value)) {
      setErrors((prev) => ({
        ...prev,
        password: "Password must be at least 6 characters long.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {loading ? "Processing..." : "Login"}
        </h1>
        <div className="space-y-4">
          <div>
            <label htmlFor="emailOrUsername" className="block text-gray-700">
              Email or Username
            </label>
            <input
              className="w-full p-2 border lowercase border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-black"
              id="emailOrUsername"
              type="text"
              value={user.emailOrUsername?.toLocaleLowerCase()}
              onChange={handleEmailOrUsernameChange}
              placeholder="Enter your email or username"
            />
            {errors.emailOrUsername && user.emailOrUsername !== "" && (
              <div className="text-red-500 text-sm mt-1">
                {errors.emailOrUsername}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700">
              Password
            </label>
            <section className="flex w-full items-center relative">
              <input
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-black"
                id="password"
                type={showPassword ? "text" : "password"}
                value={user.password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
              />
              {showPassword ? (
                <VscEye
                  className="text-xl absolute right-2 cursor-pointer top-[50%] translate-y-[-50%]"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <VscEyeClosed
                  className="text-xl absolute right-2 cursor-pointer top-[50%] translate-y-[-50%]"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </section>
            {errors.password && user.password.length > 0 && (
              <div className="text-red-500 text-sm mt-1">{errors.password}</div>
            )}
          </div>
          {errors.api && (
            <div className="text-red-500 text-center mb-4">{errors.api}</div>
          )}
          <button
            onClick={onLogin}
            disabled={buttonDisabled}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
              buttonDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            } transition-colors duration-200`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Don’t have an account?{" "}
              <span
                onClick={() => router.push("/signup")}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                Sign Up
              </span>
            </p>
            <p className="text-gray-600 mt-2">
              Forgot your password?{" "}
              <span
                onClick={() => router.push("/request-reset-password")}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                Reset Here
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

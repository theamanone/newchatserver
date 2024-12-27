"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const [token, setToken] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResendToken, setShowResendToken] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();

  // Function to verify user email
  const verifyUserEmail = async () => {
    try {
      const authToken = sessionStorage.getItem("auth_t");
      setLoading(true);
      const response = await axios.post(
        "/api/auth/verifyemail",
        { token },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      setVerified(true);
      setTimeout(() => {
        router.push("/auth/signin");
      }, 2000);
    } catch (error: any) {
      setLoading(false);
      const { error: errorMessage, status, email: responseEmail } = error.response?.data;
      setError(errorMessage || "An unknown error occurred.");

      // Set the email and determine if resend button should be shown
      if (status === 401) {
        setShowResendToken(true);
        setEmail(responseEmail || "");
      } else {
        setShowResendToken(false);
      }
    }
  };

  // Function to resend verification email
  const handleResendEmail = async () => {
    try {
      setResendLoading(true);
      const authToken = sessionStorage.getItem("auth_t");
      await axios.post(
        "/api/auth/verifyemail/resendemail",
        { email },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setResendSuccess(true);
      setTimeout(() => {
        setResendSuccess(false);
        setShowResendToken(false);
      }, 3000); // Hide success message after 3 seconds
    } catch (error: any) {
      console.error("Failed to resend email:", error);
    } finally {
      setResendLoading(false);
    }
  };

  // Extract token from the URL when the component loads
  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token");
    setToken(urlToken || "");
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">Verify Email</h1>

        {loading && (
          <div className="text-indigo-600 text-lg font-medium">
            Processing email verification...
          </div>
        )}

        {!loading && verified && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Email Verified!
            </h2>
            <p className="text-gray-700 mb-6">
              Thank you for verifying your email. You can now log in to your
              account.
            </p>
            <Link href="/auth/signin">
              <button className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300">
                Go to Login
              </button>
            </Link>
          </div>
        )}

        {!loading && !verified && !resendSuccess && (
          <div className="text-center">
            <p className="text-gray-700 mb-6">
              Click the button below to verify your email address.
            </p>
            <button
              onClick={verifyUserEmail}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300"
            >
              Verify Email
            </button>
          </div>
        )}

        {!loading && !verified && error && !resendSuccess && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Verification Failed
            </h2>
            <p className="text-gray-700 mb-6">{error}</p>

            {showResendToken && (
              <div className="flex flex-col items-center">
                <button
                  onClick={handleResendEmail}
                  className={`bg-orange-500 text-white py-2 px-4 rounded-lg transition-colors duration-300 ${
                    resendLoading
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-orange-600"
                  }`}
                  disabled={resendLoading}
                >
                  {resendLoading
                    ? "Resending..."
                    : "Resend Verification Email"}
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && resendSuccess && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Email Resent
            </h2>
            <p className="text-gray-700 mb-6">
              A new verification email has been sent to your address. Please check your inbox and follow the instructions to verify your email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

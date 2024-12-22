"use client";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import Loader from "@/components/Loader";
import { useAppContext } from "@/context/useContext";

const Loading: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { toggleDarkMode } = useAppContext();

  const handleSystemTheme = useCallback(() => {
    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const themeName = prefersDarkMode ? "dark" : "light";
    toggleDarkMode(themeName);
  }, [toggleDarkMode]);

  useLayoutEffect(() => {
    if (localStorage?.getItem("theme")) {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme === "light") {
        toggleDarkMode("light");
      } else if (storedTheme === "dark") {
        toggleDarkMode("dark");
      } else if (storedTheme === "system") {
        toggleDarkMode("system");
      }
    } else {
      handleSystemTheme();
    }
  }, [toggleDarkMode, handleSystemTheme]);

  useEffect(() => {
    const handleDOMContentLoaded = () => {
      setLoading(false);
    };

    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      setLoading(false);
    } else {
      document.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
    }

    return () => {
      document.removeEventListener("DOMContentLoaded", handleDOMContentLoaded);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return progress < 30 ? <Loader /> : null;
};

export default Loading;

import { useAppContext } from "@/context/useContext";
import { useSocket } from '@/context/SocketContext';
import { signOut } from "next-auth/react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoCheckmarkCircle, IoAlertCircle } from "react-icons/io5";
import { IoLogOutOutline } from "react-icons/io5";
import Modal from "./chat/common/Modal";
import Confirm from "./Confirm";

// ToggleSwitch Component with Animation
const ToggleSwitch = ({
  isOn,
  onToggle,
  disabled = false,
}: {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => {
  const handleClick = () => {
    if (disabled) return;
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    onToggle();
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
        isOn
          ? "bg-blue-500 dark:bg-blue-600"
          : "bg-gray-300 dark:bg-gray-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white shadow-md"
        initial={false}
        animate={{
          x: isOn ? "100%" : "0%",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.div>
  );
};

// Settings Section Component
const SettingsSection = ({
  title,
  children,
  noBorder = false,
}: {
  title: string;
  children: React.ReactNode;
  noBorder?: boolean;
}) => {
  const { isDarkMode } = useAppContext();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${
        !noBorder ? `border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}` : ""
      } pb-4 mb-4`}
    >
      <h4 className={`text-lg font-semibold mb-3 ${
        isDarkMode ? "text-gray-200" : "text-gray-800"
      }`}>
        {title}
      </h4>
      {children}
    </motion.div>
  );
};

// Setting Item Component
const SettingItem = ({
  label,
  children,
  danger = false,
}: {
  label: string;
  children: React.ReactNode;
  danger?: boolean;
}) => {
  const { isDarkMode } = useAppContext();
  
  return (
    <motion.div
      className="flex items-center justify-between py-3"
      whileHover={{ x: 5 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <span className={`text-base ${
        danger 
          ? "text-red-500 dark:text-red-400" 
          : isDarkMode 
            ? "text-gray-300" 
            : "text-gray-700"
      }`}>
        {label}
      </span>
      {children}
    </motion.div>
  );
};

// Main Settings UI Component
export default function SettingsUI({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState({
    activeStatus: true,
  });

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { isDarkMode, toggleDarkMode, handleLogout } = useAppContext();

  const handleSignOut = async () => {
     handleLogout(); // Clean up app state and storage
    await signOut({ callbackUrl: "/auth/signin" }); // Handle redirect through NextAuth
  };

  const toggleSetting = async (key: keyof typeof settings) => {
    try {
      setLoading(key);
      setError(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
      setSuccess(`${key} setting updated successfully`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError("Failed to update setting. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode(isDarkMode ? "light" : "dark");
  };

  return (
    <Modal visible={true} onClose={onClose} isDarkMode={isDarkMode} width="md" height="auto">
      <div className="p-6">
        <h3 className={`text-2xl font-semibold mb-6 ${
          isDarkMode ? "text-gray-100" : "text-gray-900"
        }`}>
          Settings
        </h3>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-100/40 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            >
              <IoAlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            >
              <IoCheckmarkCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appearance Section */}
        <SettingsSection title="Appearance">
          <SettingItem label="Dark Mode">
            <ToggleSwitch
              isOn={isDarkMode}
              onToggle={handleDarkModeToggle}
            />
          </SettingItem>
        </SettingsSection>

        {/* Privacy Section */}
        {/* <SettingsSection title="Privacy">
          <SettingItem label="Active Status">
            <ToggleSwitch
              isOn={settings.activeStatus}
              onToggle={() => toggleSetting("activeStatus")}
              disabled={loading === "activeStatus"}
            />
          </SettingItem>
        </SettingsSection> */}

        {/* Account Section */}
        <SettingsSection title="Account" noBorder>
          <SettingItem label="Logout" danger>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ${
                isDarkMode ? 'hover:text-red-400' : 'hover:text-red-600'
              }`}
            >
              <IoLogOutOutline className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </SettingItem>
        </SettingsSection>

        <Confirm
          isOpen={showLogoutConfirm}
          onConfirm={handleSignOut}
          onCancel={() => setShowLogoutConfirm(false)}
          message="Are you sure you want to logout? You'll need to sign in again to access your account."
        />
      </div>
    </Modal>
  );
}

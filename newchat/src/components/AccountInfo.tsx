import { useAppContext } from '@/context/useContext';
import Image from 'next/image';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCamera } from 'react-icons/io5';
import { FiEdit2, FiSave, FiX } from 'react-icons/fi';

export default function AccountInfoUI({ onClose }: { onClose: () => void }) {
  const { account, isDarkMode } = useAppContext();
  const [userInfo, setUserInfo] = useState({
    username: account?.username || "username",
    email: account?.email || "m@domain.com",
    status: 'Hey there! I am using ChatApp.',
    profilePicture: account?.avatar || 'https://picsum.photos/200/300?random=10',
  });

  const [editing, setEditing] = useState(false);
  const [newInfo, setNewInfo] = useState({
    username: userInfo.username,
    email: userInfo.email,
    status: userInfo.status,
  });

  const handleEditClick = () => {
    setEditing(!editing);
    if (!editing) {
      setNewInfo({
        username: userInfo.username,
        email: userInfo.email,
        status: userInfo.status,
      });
    }
  };

  const handleSaveClick = () => {
    setUserInfo({
      ...userInfo,
      ...newInfo,
    });
    setEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newPic = URL.createObjectURL(e.target.files[0]);
      setUserInfo((prevUserInfo) => ({
        ...prevUserInfo,
        profilePicture: newPic,
      }));
    }
  };

  const InputField = ({ label, name, value, type = "text" }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        className={`w-full p-3 rounded-lg border ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500'
            : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
        } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
      />
    </motion.div>
  );

  const InfoDisplay = ({ label, value }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1"
    >
      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {label}
      </span>
      <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        {value}
      </p>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full max-w-2xl mx-auto p-8 rounded-xl shadow-lg ${
        isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
      }`}
    >
      <div className="flex justify-between items-center mb-8">
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold"
        >
          Account Information
        </motion.h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className={`p-2 rounded-full ${
            isDarkMode
              ? 'hover:bg-gray-800 text-gray-400'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <FiX className="w-5 h-5" />
        </motion.button>
      </div>

      <motion.div
        className="flex justify-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative w-32 h-32"
          >
            <Image
              src={userInfo.profilePicture}
              alt="Profile"
              width={128}
              height={128}
              className={`object-cover w-full h-full rounded-full ring-4 ring-offset-2 ${
                isDarkMode
                  ? 'ring-gray-700 ring-offset-gray-900'
                  : 'ring-gray-200 ring-offset-white'
              }`}
            />
            <label
              className={`absolute inset-0 flex items-center justify-center rounded-full cursor-pointer
                bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />
              <IoCamera
                className={`w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
            </label>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <InputField label="Username" name="username" value={newInfo.username} />
              <InputField label="Email" name="email" value={newInfo.email} type="email" />
              <InputField label="Status" name="status" value={newInfo.status} />
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <InfoDisplay label="Username" value={userInfo.username} />
              <InfoDisplay label="Email" value={userInfo.email} />
              <InfoDisplay label="Status" value={userInfo.status} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="mt-8 flex justify-end gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {editing ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              <FiSave className="w-4 h-4" />
              Save
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEditClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isDarkMode
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
            >
              <FiX className="w-4 h-4" />
              Cancel
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEditClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <FiEdit2 className="w-4 h-4" />
            Edit
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

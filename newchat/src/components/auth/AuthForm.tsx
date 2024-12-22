import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/useContext';

interface AuthFormProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ children, title, subtitle }) => {
  const { isDarkMode } = useAppContext();

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`mt-6 text-center text-3xl font-extrabold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
          >
            {subtitle}
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow rounded-lg sm:px-10 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          } border`}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthForm;

"use client";
import { useAppContext } from '@/context/useContext'
import { motion } from 'framer-motion'

export default function AppLoading() {
  const { isDarkMode } = useAppContext()

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
          className="mb-8"
        >
         
        </motion.div>
        
        <div className="relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`h-1 rounded-full ${
              isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
            }`}
            style={{ width: "200px" }}
          />
          <div
            className={`absolute top-0 left-0 h-1 w-full rounded-full opacity-30 ${
              isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
            }`}
          />
        </div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`mt-4 text-sm font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          Loading your chat space...
        </motion.p>
      </div>
    </div>
  )
}

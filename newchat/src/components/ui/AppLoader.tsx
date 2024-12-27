'use client'

import { useAppContext } from '@/context/useContext'
import { motion } from 'framer-motion'
import React from 'react'

export default function AppLoader() {
  const { isDarkMode } = useAppContext()

  return (
    <div className={`w-full h-full fixed inset-0 top-0 left-0 flex items-center justify-center ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`} style={{ zIndex: 9999 }}>
      <div className="relative">
        {/* Main logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text mb-4 text-center"
        >
          NextChat
        </motion.div>

        {/* Loading animation */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
              className={`w-3 h-3 rounded-full ${
                isDarkMode 
                  ? 'bg-indigo-500' 
                  : 'bg-indigo-600'
              }`}
            />
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute -z-10 blur-3xl opacity-20">
          <div className="absolute top-0 -left-4 w-24 h-24 bg-purple-500 rounded-full mix-blend-multiply" />
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500 rounded-full mix-blend-multiply" />
        </div>
      </div>
    </div>
  )
}

'use client';

import { useAppContext } from '@/context/useContext';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  const { isDarkMode } = useAppContext();

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 w-full max-w-md mx-auto"
        >
          <svg
            className={`w-full h-auto max-w-lg mx-auto ${
              isDarkMode ? 'text-gray-700' : 'text-gray-200'
            }`}
            viewBox="0 0 500 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background circles */}
            <circle cx="250" cy="200" r="180" fill="currentColor" />
            <circle
              cx="250"
              cy="200"
              r="150"
              fill={isDarkMode ? '#1F2937' : '#F9FAFB'}
            />
            
            {/* 404 Text */}
            <text
              x="250"
              y="180"
              textAnchor="middle"
              className="text-8xl font-bold"
              fill={isDarkMode ? '#4B5563' : '#E5E7EB'}
              style={{ fontSize: '100px' }}
            >
              404
            </text>
            
            {/* Chat bubble decorations */}
            <g transform="translate(150, 220)">
              <rect
                x="0"
                y="0"
                width="60"
                height="40"
                rx="20"
                fill={isDarkMode ? '#374151' : '#E5E7EB'}
              />
              <circle cx="20" cy="20" r="5" fill={isDarkMode ? '#4B5563' : '#D1D5DB'} />
              <circle cx="40" cy="20" r="5" fill={isDarkMode ? '#4B5563' : '#D1D5DB'} />
            </g>
            <g transform="translate(290, 220)">
              <rect
                x="0"
                y="0"
                width="60"
                height="40"
                rx="20"
                fill={isDarkMode ? '#374151' : '#E5E7EB'}
              />
              <circle cx="20" cy="20" r="5" fill={isDarkMode ? '#4B5563' : '#D1D5DB'} />
              <circle cx="40" cy="20" r="5" fill={isDarkMode ? '#4B5563' : '#D1D5DB'} />
            </g>
          </svg>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 px-4"
        >
          <h1 className={`text-4xl md:text-5xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Page Not Found
          </h1>
          
          <p className={`text-lg md:text-xl max-w-md mx-auto ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Looks like you&apos;ve ventured into uncharted territory. Let&apos;s get you back on track.
          </p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-4"
          >
            <Link
              href="/"
              className={`inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } shadow-lg hover:shadow-xl`}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Return Home
            </Link>
          </motion.div>

          {/* Decorative dots */}
          <div className="absolute top-0 right-0 -z-10 opacity-20">
            <div className="w-48 h-48 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full filter blur-3xl"></div>
          </div>
          <div className="absolute bottom-0 left-0 -z-10 opacity-20">
            <div className="w-48 h-48 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full filter blur-3xl"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

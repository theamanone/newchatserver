import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IoSearchOutline, IoCloseOutline } from 'react-icons/io5'
import { useAppContext } from '@/context/useContext'

interface SearchProps {
  searchType: string
  setSearchQuery?: any
}

const SearchIcon = () => (
  <motion.svg
    key={0}
    width='20'
    height='20'
    viewBox='0 0 20 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <motion.path
      d='M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Z'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    />
    <motion.path
      d='M15 15L19 19'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut', delay: 0.3 }}
    />
  </motion.svg>
)

function Search ({ searchType, setSearchQuery }: SearchProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchIconShow, setSearchIconShow] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [inputAnimation, setInputAnimation] = useState(false)
  const [iconKey, setIconKey] = useState(0)
  const { isDarkMode, isMobile } = useAppContext() || {}

  // Animated placeholder text
  const placeholders = [
    'Search messages...',
    'Find friends...',
    'Search by name...',
    'Type to search...'
  ]
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)

  useEffect(() => {
    if (!isFocused) {
      const interval = setInterval(() => {
        setCurrentPlaceholder(prev => (prev + 1) % placeholders.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isFocused])

  useEffect(() => {
    if (inputValue.length > 0) {
      setSearchIconShow(false)
      setInputAnimation(true)
      setTimeout(() => setInputAnimation(false), 500)
    } else {
      setSearchIconShow(true)
      setIconKey(prev => prev + 1) // Increment key to trigger animation
    }
  }, [inputValue])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
    setSearchQuery(event.target.value)
  }

  const handleInputFocus = () => {
    setIsFocused(true)
  }

  const handleInputBlur = () => {
    setIsFocused(false)
    if (inputValue.length === 0) {
      setSearchIconShow(true)
      setIconKey(prev => prev + 1) // Increment key to trigger animation
    }
  }

  const handleClearInput = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInputValue('')
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-[95%]  mx-auto flex items-center mb-1 justify-center ${
        isMobile ? 'h-[42px]' : 'h-[45px]'
      }`}
    >
      <motion.section
        className={`relative flex items-center h-full rounded-xl transition-all overflow-hidden ${
          isDarkMode
            ? isFocused
              ? 'bg-[#1f1f1f]'
              : 'bg-[#2a2a2a]'
            : isFocused
            ? 'bg-[#f8f8f8] shadow-sm'
            : 'bg-[#f0f0f0]'
        } ${isMobile ? 'w-[98%]' : 'w-full'}`}
        animate={{
          scale: isFocused ? 1.01 : 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => searchInputRef.current?.focus()}
      >
        <AnimatePresence mode='wait'>
          <motion.div
            key={searchIconShow ? 'search' : 'clear'}
            className='ml-3 flex items-center justify-center w-[24px]'
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {searchIconShow ? (
              <SearchIcon />
            ) : (
              <motion.button
                onClick={handleClearInput}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className='outline-none'
              >
                <IoCloseOutline
                  className={`text-xl cursor-pointer transition-all ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.div
          className='flex-1 relative'
          animate={
            inputAnimation
              ? {
                  scale: [1, 1.02, 1],
                  transition: { duration: 0.3 }
                }
              : {}
          }
        >
          <input
            type='text'
            ref={searchInputRef}
            name='userSearch'
            id='userSearch'
            className={`w-full h-full px-3 outline-none bg-transparent transition-colors ${
              isDarkMode
                ? 'text-white placeholder-gray-500'
                : 'text-gray-800 placeholder-gray-400'
            }`}
            placeholder={placeholders[currentPlaceholder]}
            maxLength={200}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </motion.div>
      </motion.section>
    </motion.div>
  )
}

export default Search

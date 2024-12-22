'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { VscEye, VscEyeClosed } from 'react-icons/vsc'
import { useAppContext } from '@/context/useContext'
import { signIn } from 'next-auth/react'
import { IoArrowBack } from 'react-icons/io5'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [user, setUser] = useState({
    emailOrUsername: '',
    password: ''
  })
  const [buttonDisabled, setButtonDisabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{
    emailOrUsername?: string
    password?: string
    api?: string
  }>({})
  const [showPassword, setShowPassword] = useState(false)
  const { isMobile, isDarkMode } = useAppContext()

  const validateEmailOrUsername = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/
    return emailRegex.test(value) || usernameRegex.test(value)
  }

  const validatePassword = (value: string) => {
    return value.length >= 6
  }

  const onLogin = async () => {
    const emailOrUsernameError = !validateEmailOrUsername(user.emailOrUsername)
      ? 'Invalid email or username format.'
      : undefined

    const passwordError =
      user.password.length > 0 && !validatePassword(user.password)
        ? 'Password must be at least 6 characters long.'
        : undefined

    if (emailOrUsernameError || passwordError) {
      setErrors({
        emailOrUsername: emailOrUsernameError,
        password: passwordError
      })
      return
    }

    try {
      setLoading(true)
      const response = await signIn('credentials', {
        redirect: false,
        emailOrUsername: user.emailOrUsername,
        password: user.password
      })

      if (response?.error) {
        setErrors({
          api: response.error || 'Error logging in. Please try again later.'
        })
      } else {
        router.push('/')
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setErrors({
        api: 'An unexpected error occurred. Please try again later.'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const isValid = user.emailOrUsername.length > 3 && user.password.length > 0
    setButtonDisabled(!isValid)
  }, [user])

  const handleEmailOrUsernameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setUser({ ...user, emailOrUsername: value })
    if (!validateEmailOrUsername(value)) {
      setErrors(prev => ({
        ...prev,
        emailOrUsername: 'Invalid email or username format.'
      }))
    } else {
      setErrors(prev => ({ ...prev, emailOrUsername: undefined }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUser({ ...user, password: value })
    if (value.length > 0 && !validatePassword(value)) {
      setErrors(prev => ({
        ...prev,
        password: 'Password must be at least 6 characters long.'
      }))
    } else {
      setErrors(prev => ({ ...prev, password: undefined }))
    }
  }

  return (
    <div className={`min-h-screen flex flex-col ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`p-4 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <IoArrowBack className={`w-6 h-6 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`} />
          </Link>
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
            NextChat
          </div>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md ${
            isMobile ? 'w-[95%] p-5' : 'p-8'
          } ${
            isDarkMode 
              ? 'bg-gray-800 text-white' 
              : 'bg-white text-gray-900'
          }  rounded-xl shadow-lg`}
        >
          <h1 className={`text-3xl font-bold mb-6 text-center ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {loading ? 'Processing...' : 'Sign In'}
          </h1>

          <div className="space-y-4">
            <div>
              <label htmlFor="emailOrUsername" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email or Username
              </label>
              <input
                className={`w-full p-2.5 mt-1 border rounded-lg focus:outline-none focus:ring-2 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-500' 
                    : 'bg-white border-gray-300 text-black focus:ring-indigo-500'
                }`}
                id="emailOrUsername"
                type="text"
                value={user.emailOrUsername?.toLowerCase()}
                onChange={handleEmailOrUsernameChange}
                placeholder="Enter your email or username"
              />
              {errors.emailOrUsername && user.emailOrUsername !== '' && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.emailOrUsername}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="relative mt-1 z-0">
                <input
                  className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 !z-0 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-500' 
                      : 'bg-white border-gray-300 text-black focus:ring-indigo-500'
                  }`}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={user.password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  {showPassword ? <VscEye size={20} /> : <VscEyeClosed size={20} />}
                </button>
              </div>
              {errors.password && user.password.length > 0 && (
                <div className="text-red-500 text-sm mt-1">{errors.password}</div>
              )}
            </div>

            {errors.api && (
              <div className="text-red-500 text-sm text-center">
                {errors.api}
              </div>
            )}

            <button
              onClick={onLogin}
              disabled={buttonDisabled}
              className={`w-full py-2.5 rounded-lg text-white font-medium transition-all duration-200 ${
                buttonDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-[1.02]'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className={`text-sm text-center space-y-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <p>
                Don&apos;t have an account?{' '}
                <Link
                  href="/auth/register"
                  className="text-indigo-500 hover:text-indigo-600 font-medium"
                >
                  Sign up
                </Link>
              </p>
              <p>
                <Link
                  href="/request-reset-password"
                  className="text-indigo-500 hover:text-indigo-600 font-medium"
                >
                  Forgot password?
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

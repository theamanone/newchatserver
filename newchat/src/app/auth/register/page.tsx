'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import { VscEye, VscEyeClosed } from 'react-icons/vsc'
import { toast } from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [user, setUser] = useState({
    email: 'amankirmara144@gmail.com',
    password: 'Aman@123'
  })

  const [errors, setErrors] = useState({
    email: '',
    password: ''
  })

  const [touched, setTouched] = useState({
    email: false,
    password: false
  })

  const [buttonDisabled, setButtonDisabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const validate = () => {
    const newErrors: any = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(user.email) && touched.email) {
      newErrors.email = 'Please provide a valid email address.'
    }

    // Password validation
    if (user.password.length < 6 && touched.password) {
      newErrors.password = 'Password must be at least 6 characters long.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: string, value: string) => {
    setUser({ ...user, [field]: value })
    setTouched({ ...touched, [field]: true })
    validate()
  }

  const onRegister = async () => {
    if (!validate()) return

    try {
      setLoading(true)
      setSuccessMessage('')
      
      const response = await axios.post('/api/auth/register', user)
      
      // Show success message
      toast.success('Registration successful! Please check your email to verify your account.')
      setSuccessMessage('Registration successful! Please check your email to verify your account.')
      
      // Clear form
      setUser({ email: '', password: '' })
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)
    } catch (error: any) {
      // Handle different types of errors
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(errorMessage)
      
      if (error.response?.status === 409) {
        setErrors(prev => ({
          ...prev,
          email: 'This email is already registered. Please use a different email or sign in.'
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const isValid = user.email && user.password && Object.keys(errors).length === 0
    setButtonDisabled(!isValid)
  }, [user, errors])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {loading ? 'Processing...' : 'Register'}
        </h1>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700">
              Email
            </label>
            <input
              className={`w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-black ${
                errors.email ? 'border-red-500' : ''
              }`}
              id="email"
              type="email"
              value={user.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
            />
            {errors.email && touched.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                className={`w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-black ${
                  errors.password ? 'border-red-500' : ''
                }`}
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={user.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <VscEyeClosed className="w-5 h-5 text-gray-500" />
                ) : (
                  <VscEye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
            {errors.password && touched.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            onClick={onRegister}
            disabled={buttonDisabled || loading}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors duration-200 ${
              buttonDisabled || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Registering...
              </span>
            ) : (
              'Register'
            )}
          </button>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

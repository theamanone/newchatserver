'use client';

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAppContext } from '@/context/useContext'
import Image from 'next/image'
import { DEFAULT_PROFILE_PICTURE } from '@/lib/data'
import { HiOutlineXMark } from 'react-icons/hi2'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import { toast } from 'react-toastify'
import { deleteAccount } from '@/utils/apihandler'
import { signOut } from 'next-auth/react'
import Confirm from '@/components/Confirm'
import { useLoadingBar } from '@/hooks/useLoadingBar'
import { useRouter, usePathname } from 'next/navigation'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface Session {
  ipAddress: string
  loginAt: string
  deviceId: string
  deviceType: string
  currentDevice: boolean
}

type ConfirmAction = {
  action: 'logoutSession' | 'logoutAllSessions'
  deviceId?: string
}

export default function ProfilePage () {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [isDeleteFinalConfirmOpen, setDeleteFinalConfirmOpen] = useState(false)
  const { account, isDarkMode } = useAppContext()
  const [userInfo, setUserInfo] = useState({
    username: 'username',
    email: 'm@domain.com',
    status: 'Hey there! I am using ChatApp.',
    profilePicture: DEFAULT_PROFILE_PICTURE
  })
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newInfo, setNewInfo] = useState({
    username: userInfo.username,
    email: userInfo.email,
    status: userInfo.status
  })
  const didFetchRefSession = useRef(false)
  const loadingBar = useLoadingBar();
  const router = useRouter()
  const pathname = usePathname()
  const homeLoaded = useRef(false)

  // Preload home page
  useEffect(() => {
    const preloadHome = async () => {
      try {
        // Only preload if we're on the profile page and haven't loaded home yet
        if (pathname === '/profile' && !homeLoaded.current) {
          // Start loading the home page in the background
          router.prefetch('/')
          homeLoaded.current = true
        }
      } catch (error) {
        console.error('Failed to preload home page:', error)
      }
    }
    preloadHome()
  }, [pathname, router])

  const handleGoBack = () => {
    loadingBar.start()
    // Force a hard navigation to home if it's not loaded
    if (!homeLoaded.current) {
      window.location.href = '/'
      return
    }
    // Soft navigation if home is preloaded
    router.push('/')
  }

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (pathname === '/profile') {
        handleGoBack()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [pathname])

  // Handle beforeunload to ensure home page is loaded when browser is closed/refreshed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pathname === '/profile' && !homeLoaded.current) {
        router.prefetch('/')
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pathname, router])

  // Update user info when the account changes
  useEffect(() => {
    setUserInfo({
      username: account?.username || 'username',
      email: account?.email || 'm@domain.com',
      status: 'Hey there! I am using ChatApp.',
      profilePicture: account?.avatar || DEFAULT_PROFILE_PICTURE
    })
  }, [account])

  // Fetch user sessions from the server
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        loadingBar.start();
        setLoading(true)
        const { data } = await axios.get('/api/v1/user/sessions')
        setSessions(data.sessions)
        setLoading(false)
      } catch (err) {
        setError('Failed to load sessions. Please try again.')
        setLoading(false)
      } finally {
        loadingBar.finish();
        setLoading(false)
      }
    }
    if (didFetchRefSession.current) return
    didFetchRefSession.current = true
    fetchSessions()
  }, [])

  // Handle profile picture change
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPic = URL.createObjectURL(e.target.files[0])
      setUserInfo(prevUserInfo => ({
        ...prevUserInfo,
        profilePicture: newPic
      }))
    }
  }

  // Handle profile information changes
  const handleEditClick = () => setEditing(!editing)
  const handleSaveClick = () => {
    setUserInfo({ ...userInfo, ...newInfo })
    setEditing(false)
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewInfo(prevInfo => ({
      ...prevInfo,
      [name]: value
    }))
  }

  // Session management handlers
  const handleOnConfirm = async () => {
    if (confirmAction) {
      try {
        const { action, deviceId } = confirmAction
        if (action === 'logoutAllSessions') {
          await axios.post('/api/v1/user/sessions', { logoutAll: true })
          setSessions([])
          toast.success('Logged out from all devices')
          // Add a small delay before signing out the current user
          setTimeout(() => {
            signOut({ callbackUrl: "/" })
          }, 1000)
        } else if (action === 'logoutSession' && deviceId) {
          await axios.post('/api/v1/user/sessions', { deviceId })
          setSessions(sessions.filter(session => session.deviceId !== deviceId))
          toast.success('Session logged out successfully')
        }
      } catch (error) {
        toast.error('Failed to logout session')
      }
      setConfirmAction(null)
      setShowConfirmDialog(false)
    }
  }

  // Account deletion handlers
  const handleDeleteConfirmOpen = () => setDeleteConfirmOpen(true)
  const handleDeleteConfirmClose = () => setDeleteConfirmOpen(false)
  const handleDeleteFinalConfirmOpen = () => {
    setDeleteConfirmOpen(false)
    setDeleteFinalConfirmOpen(true)
  }
  const handleDeleteFinalConfirmClose = () => setDeleteFinalConfirmOpen(false)

  const handleDeleteFinalConfirmation = async (inputValue?: string) => {
    try {
      if (inputValue?.toLowerCase() === 'delete') {
        const response = await deleteAccount()
        if (response?.message === 'Account deleted successfully') {
          toast.success('Account deleted successfully.')
          signOut()
        }
      }
    } catch (err) {
      setError(
        'An error occurred while deleting the account. Please try again.'
      )
      console.error(err)
    }
    setDeleteFinalConfirmOpen(false)
  }

  // Parse device type
  const parseDeviceType = (userAgent: string) => {
    if (/mobile/i.test(userAgent)) return 'Mobile'
    if (/android/i.test(userAgent)) return 'Android'
    if (/iPad|iPhone|iPod/i.test(userAgent)) return 'iOS'
    if (/windows/i.test(userAgent)) return 'Windows'
    if (/macintosh/i.test(userAgent)) return 'Mac'
    if (/linux/i.test(userAgent)) return 'Linux'
    return 'Desktop'
  }

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className={`relative ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} max-w-4xl mx-auto p-8 rounded-3xl shadow-lg w-full`}>
        {/* Close Button Skeleton */}
        <div className="absolute top-4 right-4">
          <Skeleton circle width={32} height={32} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <Skeleton width={150} height={36} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
        </div>

        {/* Profile Picture */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Skeleton circle width={144} height={144} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
            <div className="absolute bottom-0 right-0">
              <Skeleton circle width={40} height={40} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
            </div>
          </div>
        </div>

        {/* User Info Fields */}
        <div className="space-y-6 max-w-lg mx-auto">
          {/* Username */}
          <div>
            <Skeleton width={80} height={24} className="mb-2" baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
            <Skeleton height={48} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
          </div>

          {/* Email */}
          <div>
            <Skeleton width={60} height={24} className="mb-2" baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
            <Skeleton height={48} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
          </div>

          {/* Status */}
          <div>
            <Skeleton width={70} height={24} className="mb-2" baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
            <Skeleton height={48} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
          </div>

          {/* Edit Button */}
          <div className="flex justify-center pt-4">
            <Skeleton width={120} height={40} borderRadius={8} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
          </div>
        </div>

        {/* Sessions Section */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <Skeleton width={160} height={32} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
            <Skeleton width={140} height={40} borderRadius={20} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton width={100} height={20} className="mb-2" baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
                    <Skeleton width={150} height={16} className="mb-1" baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
                    <Skeleton width={120} height={16} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
                  </div>
                  <Skeleton width={80} height={32} borderRadius={16} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Skeleton width={120} height={28} className="mb-4" baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
          <Skeleton height={48} borderRadius={8} baseColor={isDarkMode ? '#374151' : undefined} highlightColor={isDarkMode ? '#4B5563' : undefined} />
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto">
          <svg className="w-full h-full text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{error}</h3>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )

  return (
    <>
    
        <Confirm
          isOpen={showConfirmDialog}
          onConfirm={handleOnConfirm}
          onCancel={() => {
            setConfirmAction(null)
            setShowConfirmDialog(false)
          }}
          message={
            confirmAction?.action === 'logoutAllSessions'
              ? 'Are you sure you want to log out from all devices? This will also log you out from your current session and redirect you to the login page.'
              : `Are you sure you want to log out from this session?`
          }
        />

      <div
        className={`relative ${
          isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        } max-w-4xl mx-auto my-10 p-8 rounded-3xl shadow-lg`}
      >
        <button
          onClick={handleGoBack}
          className='absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
          title='Close'
        >
          <HiOutlineXMark className='w-6 h-6' />
        </button>
        <h1 className='text-3xl font-extrabold text-center mb-8'>Profile</h1>

        {/* Profile Picture Section */}
        <div className='flex justify-center mb-8'>
          <div className='relative w-36 h-36'>
            <div className='w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-gray-300 dark:border-gray-700'>
              <Image
                src={userInfo.profilePicture}
                alt='Profile'
                width={144}
                height={144}
                className='object-cover w-full h-full'
              />
            </div>
            {/* <label className='absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-colors'>
              <HiOutlineCamera className='w-5 h-5 text-white' />
              <input
                type='file'
                accept='image/*'
                onChange={handleProfilePicChange}
                className='hidden'
              />
            </label> */}
          </div>
        </div>

        {/* User Information */}
        {loading ? (
          <div className='space-y-6 animate-pulse'>
            <div>
              <div className='h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2'></div>
              <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded'></div>
            </div>
            <div>
              <div className='h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2'></div>
              <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded'></div>
            </div>
            <div>
              <div className='h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2'></div>
              <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded'></div>
            </div>
          </div>
        ) : (
          <div className='space-y-6'>
            <div>
              <label className='block text-lg font-semibold mb-2'>Username</label>
              {editing ? (
                <input
                  type='text'
                  name='username'
                  value={newInfo.username}
                  onChange={handleChange}
                  className='w-full p-3 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                />
              ) : (
                <p className='text-xl'>{userInfo.username}</p>
              )}
            </div>

            <div>
              <label className='block text-lg font-semibold mb-2'>Email</label>
              {editing ? (
                <input
                  type='email'
                  name='email'
                  value={newInfo.email}
                  onChange={handleChange}
                  className='w-full p-3 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                />
              ) : (
                <p className='text-xl'>{userInfo.email}</p>
              )}
            </div>

            <div>
              <label className='block text-lg font-semibold mb-2'>Status</label>
              {editing ? (
                <input
                  type='text'
                  name='status'
                  value={newInfo.status}
                  onChange={handleChange}
                  className='w-full p-3 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                />
              ) : (
                <p className='text-xl'>{userInfo.status}</p>
              )}
            </div>

            <div className='flex justify-center'>
              <button
                onClick={editing ? handleSaveClick : handleEditClick}
                className='px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
              >
                {editing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Active Sessions */}
        <div className='mt-12'>
          <div className="flex justify-between items-center mb-6">
            <h2 className='text-2xl font-bold'>Active Sessions</h2>
            {sessions.length > 1 && (
              <button
                onClick={() => {
                  setConfirmAction({ action: 'logoutAllSessions' })
                  setShowConfirmDialog(true)
                }}
                className="px-4 py-2 text-sm font-medium text-red-500 hover:text-white hover:bg-red-500 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600 rounded-full transition-all duration-200 border border-red-500 dark:border-red-400 hover:border-transparent"
              >
                Logout All Devices
              </button>
            )}
          </div>
          <div className='space-y-4'>
            {sessions.map(session => (
              <div
                key={session.deviceId}
                className={`p-4 rounded-lg flex justify-between items-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}
              >
                <div>
                  <p className='font-medium'>
                    {parseDeviceType(session.deviceType)}
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-300'>
                    Last active: {formatRelativeTime(session.loginAt)}
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-300'>
                    IP: {session.ipAddress}
                  </p>
                </div>
                {session.currentDevice ? (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    isDarkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-800'
                  }`}>
                    Current Device
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmAction({
                        action: 'logoutSession',
                        deviceId: session.deviceId
                      })
                      setShowConfirmDialog(true)
                    }}
                    className={`text-red-500 hover:text-red-600 ${
                      isDarkMode ? 'hover:text-red-500' : ''
                    }`}
                  >
                    Logout
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className='mt-12 p-6 border-2 border-red-200 dark:border-red-900/50 rounded-xl'>
          <h3 className='text-xl font-bold text-red-600 mb-4'>Danger Zone</h3>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <button
            onClick={handleDeleteConfirmOpen}
            className='w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700'
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <Confirm
        isOpen={isDeleteConfirmOpen}
        onConfirm={handleDeleteFinalConfirmOpen}
        onCancel={handleDeleteConfirmClose}
        message='Are you sure you want to delete your account? This action cannot be undone.'
      />

      <Confirm
        isOpen={isDeleteFinalConfirmOpen}
        onConfirm={handleDeleteFinalConfirmation}
        onCancel={handleDeleteFinalConfirmClose}
        message="Type 'DELETE' to confirm that you want to permanently delete your account."
        showInput={true}
      />
    </>
  )
}

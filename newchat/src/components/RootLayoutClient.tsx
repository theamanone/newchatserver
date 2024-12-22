'use client'

import { SocketProvider } from '@/context/SocketContext'
import { AppProvider } from '@/context/useContext'
import { LoadingProvider } from '@/providers/LoadingProvider'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

export default function RootLayoutClient ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <AppProvider>
        <LoadingProvider>
          <SocketProvider>
            {children}
            <Toaster position='top-center' />
          </SocketProvider>
        </LoadingProvider>
      </AppProvider>
    </SessionProvider>
  )
}

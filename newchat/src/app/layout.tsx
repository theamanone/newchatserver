import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import RootLayoutClient from '@/components/RootLayoutClient'
import LeftPanelWrapper from '@/components/panels/LeftPanelWrapper'

// Importing local fonts
const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900'
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900'
})

// Metadata for the app
export const metadata: Metadata = {
  title: 'Chat App',
  description: 'real-time chat application'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-gray-50 flex dynamic-height`}>
        <RootLayoutClient>
          <div className='flex w-screen overflow-y-auto max-h-screen'>
            <LeftPanelWrapper />
            <div className='flex-grow'>{children}</div>
          </div>
        </RootLayoutClient>
      </body>
    </html>
  )
}

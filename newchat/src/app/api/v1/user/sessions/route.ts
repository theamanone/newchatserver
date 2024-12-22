// src/app/api/v1/sessions.ts

import User from '@/app/models/user.model'
import dbConnect from '@/dbConfig/dbConfig'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getDataFromToken } from '@/app/(lib)/getDataFromToken'

export async function POST (request: NextRequest) {
  await dbConnect()

  try {
    const { userId } = await getDataFromToken(request)
    const reqBody = await request.json()
    const { deviceId, logoutAll = false } = reqBody

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 })
    }

    // Logout all sessions if logoutAll is true
    if (logoutAll) {
      await user.clearAllSessions()
      return NextResponse.json(
        { message: 'Logged out from all sessions.' },
        { status: 200 }
      )
    }

    // Logout a specific session if deviceId is provided
    if (deviceId) {
      await user.removeSessionByDeviceId(deviceId)
      return NextResponse.json(
        { message: `Logged out from session with deviceId: ${deviceId}` },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { message: 'Specify a deviceId or set logoutAll to true.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in sessions route:', error)
    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

// GET route for retrieving active sessions
export async function GET (request: NextRequest) {
  await dbConnect()
  try {

    const { userId, deviceId: currentDeviceId } = await getDataFromToken(
      request
    )
    
    const user = await User.findById(userId).select('sessions')


    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 })
    }

    const sessionData = user.sessions.map((session: any) => ({
      deviceId: session.deviceId,
      loginAt: session.loginAt,
      ipAddress: session.ipAddress,
      deviceType: session.deviceType,
      currentDevice: session.deviceId === currentDeviceId
    }))
    return NextResponse.json({ sessions: sessionData }, { status: 200 })
  } catch (error) {
    console.error('Error retrieving sessions:', error)
    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
